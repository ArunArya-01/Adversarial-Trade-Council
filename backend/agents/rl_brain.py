"""
agents/rl_brain.py — TradeMind RL Brain
=========================================
Custom Gymnasium trading environment + Stable-Baselines3 PPO model.

TradingEnv
----------
Observation space : Box(10,)  — last 10 normalised OHLCV-derived features
Action space      : Discrete(3) — 0=HOLD, 1=BUY, 2=SELL
Reward            : Δ portfolio value per step (simple mark-to-market P&L)

The environment uses Geometric Brownian Motion (GBM) to generate a synthetic
price series on each reset(), making it usable immediately without real data.
Swap `_generate_price_series()` with a real OHLCV feed in Phase 4.

RLBrain
-------
Wraps PPO from stable-baselines3.  Loads a checkpoint if one exists, otherwise
initialises a fresh (untrained) model.  The `get_signal()` method returns the
raw action probabilities as confidence metrics — these feed into the XAI logs.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env

from core import logger as log


# ── Action mapping ────────────────────────────────────────────────────────────

ACTION_MAP = {0: "HOLD", 1: "BUY", 2: "SELL"}
WINDOW_SIZE = 10          # number of historical candles in each observation
OBS_FEATURES = 5          # open, high, low, close, volume (normalised)
OBS_DIM = WINDOW_SIZE * OBS_FEATURES  # 50-dimensional obs vector


# ── Geometric Brownian Motion helper ─────────────────────────────────────────

def _gbm_prices(
    n: int = 500,
    s0: float = 100.0,
    mu: float = 0.0002,
    sigma: float = 0.015,
    seed: Optional[int] = None,
) -> np.ndarray:
    """Generate a synthetic closing price series via GBM."""
    rng = np.random.default_rng(seed)
    dt = 1.0
    returns = rng.normal(mu, sigma, size=n)
    prices = s0 * np.exp(np.cumsum(returns))
    return prices.astype(np.float32)


# ── Custom Gymnasium Environment ──────────────────────────────────────────────

class TradingEnv(gym.Env):
    """
    Minimal Gymnasium trading environment for SB3 compatibility.

    Observation: flattened [open, high, low, close, volume] for the last
                 WINDOW_SIZE candles, each normalised by its rolling mean.
    Action:      0 = HOLD, 1 = BUY, 2 = SELL
    Reward:      per-step mark-to-market P&L (fraction)
    """

    metadata = {"render_modes": ["human"]}

    def __init__(self, episode_length: int = 480) -> None:
        super().__init__()
        self.episode_length = episode_length

        self.observation_space = spaces.Box(
            low=-10.0,
            high=10.0,
            shape=(OBS_DIM,),
            dtype=np.float32,
        )
        self.action_space = spaces.Discrete(3)  # HOLD / BUY / SELL

        # Internal state (populated in reset)
        self._prices: np.ndarray = np.array([])
        self._step_idx: int = 0
        self._position: int = 0  # -1 SHORT, 0 FLAT, 1 LONG
        self._entry_price: float = 0.0

    # ── Gymnasium API ─────────────────────────────────────────────────────────

    def reset(
        self,
        *,
        seed: Optional[int] = None,
        options: Optional[dict] = None,
    ) -> Tuple[np.ndarray, dict]:
        super().reset(seed=seed)
        total_candles = self.episode_length + WINDOW_SIZE + 1
        self._prices = _gbm_prices(n=total_candles, seed=seed)
        self._step_idx = WINDOW_SIZE
        self._position = 0
        self._entry_price = 0.0
        return self._get_obs(), {}

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, dict]:
        price_now = self._prices[self._step_idx]
        price_prev = self._prices[self._step_idx - 1]

        # Compute step reward
        reward = self._compute_reward(action, price_now, price_prev)

        # Update state
        self._update_position(action, price_now)
        self._step_idx += 1

        terminated = self._step_idx >= len(self._prices) - 1
        truncated = False

        return self._get_obs(), reward, terminated, truncated, {}

    def render(self) -> None:  # type: ignore[override]
        print(
            f"Step {self._step_idx} | Price ${self._prices[self._step_idx]:.2f} "
            f"| Position {self._position}"
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _get_obs(self) -> np.ndarray:
        """Returns the WINDOW_SIZE × OBS_FEATURES observation, normalised."""
        window = self._prices[self._step_idx - WINDOW_SIZE : self._step_idx]
        mean = window.mean() or 1.0

        # Simulate OHLCV from GBM close prices (simplification)
        # In Phase 4 replace with real OHLCV dataframe slices
        obs_rows = []
        for close in window:
            noise = np.random.uniform(0.995, 1.005, 4)
            o = close * noise[0]
            h = close * max(noise[1], noise[0])
            l = close * min(noise[2], noise[0])  # noqa: E741
            v = abs(np.random.normal(1_000_000, 200_000))
            obs_rows.append([o / mean, h / mean, l / mean, close / mean, v / 1_000_000])

        return np.array(obs_rows, dtype=np.float32).flatten()

    def _compute_reward(self, action: int, price_now: float, price_prev: float) -> float:
        price_change = (price_now - price_prev) / price_prev
        if self._position == 1:   # Long
            return float(price_change)
        elif self._position == -1:  # Short
            return float(-price_change)
        return -0.0001  # Small holding cost for flat positions

    def _update_position(self, action: int, price_now: float) -> None:
        if action == 1 and self._position != 1:   # BUY
            self._position = 1
            self._entry_price = price_now
        elif action == 2 and self._position != -1:  # SELL
            self._position = -1
            self._entry_price = price_now
        # HOLD: no change


# ── RL Signal ─────────────────────────────────────────────────────────────────

@dataclass
class RLSignal:
    """Structured output from the RL Brain's policy network."""
    action: str          # "HOLD" | "BUY" | "SELL"
    action_id: int       # 0, 1, 2
    confidence: float    # probability assigned to the chosen action
    raw_probs: List[float]  # [P(HOLD), P(BUY), P(SELL)] — for XAI display
    obs: List[float]     # raw observation that produced this signal

    def to_dict(self) -> dict:
        return {
            "action": self.action,
            "action_id": self.action_id,
            "confidence": round(self.confidence, 4),
            "raw_probs": [round(p, 4) for p in self.raw_probs],
            "obs_dim": len(self.obs),
        }


# ── RL Brain ──────────────────────────────────────────────────────────────────

class RLBrain:
    """
    Manages the PPO model lifecycle and exposes a clean `get_signal()` API.

    The model is untrained at initialisation (Phase 1 scaffold).
    Training loop will be added in a future `/api/train` endpoint (Phase 2).
    Until trained, `get_signal()` returns stochastic but structurally valid
    signals — sufficient for testing the full pipeline end-to-end.
    """

    def __init__(self, checkpoint_path: str = "") -> None:
        self.env = TradingEnv()
        self.model: PPO = self._load_or_init(checkpoint_path)
        log.info(
            f"RLBrain initialised — action space: {self.env.action_space}",
            agent="rl_brain",
        )

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def _load_or_init(self, path: str) -> PPO:
        if path and os.path.exists(path):
            log.info(f"Loading PPO checkpoint from: {path}", agent="rl_brain")
            return PPO.load(path, env=self.env)

        log.info(
            "No checkpoint found — initialising fresh PPO(MlpPolicy). "
            "Model is UNTRAINED — signals are stochastic placeholders.",
            agent="rl_brain",
        )
        return PPO(
            "MlpPolicy",
            self.env,
            verbose=0,
            learning_rate=3e-4,
            n_steps=2048,
            batch_size=64,
            n_epochs=10,
            gamma=0.99,
            gae_lambda=0.95,
            clip_range=0.2,
            ent_coef=0.01,
        )

    def save(self, path: str) -> None:
        """Persist the current model weights."""
        self.model.save(path)
        log.info(f"PPO model saved → {path}", agent="rl_brain")

    def validate_env(self) -> bool:
        """Run SB3's built-in environment sanity checks."""
        try:
            check_env(self.env, warn=True)
            return True
        except Exception as exc:
            log.warn(f"Environment validation warning: {exc}", agent="rl_brain")
            return False

    # ── Inference ─────────────────────────────────────────────────────────────

    def get_signal(self, obs: Optional[np.ndarray] = None) -> RLSignal:
        """
        Run a forward pass through the PPO policy and return a structured signal.

        Parameters
        ----------
        obs : np.ndarray or None
            Observation vector of shape (OBS_DIM,). If None, a fresh
            observation is sampled from a reset environment.

        Returns
        -------
        RLSignal with action, confidence, and raw action probabilities.
        """
        if obs is None:
            obs, _ = self.env.reset()

        obs_tensor = np.array(obs, dtype=np.float32).reshape(1, -1)

        # Use SB3's policy to get action probabilities
        import torch
        with torch.no_grad():
            obs_th = self.model.policy.obs_to_tensor(obs_tensor)[0]
            distribution = self.model.policy.get_distribution(obs_th)
            probs = distribution.distribution.probs.squeeze().cpu().numpy()

        action_id = int(np.argmax(probs))
        confidence = float(probs[action_id])
        action_str = ACTION_MAP[action_id]

        log.info(
            f"RL signal: {action_str} (confidence={confidence:.2%}, "
            f"probs={[f'{p:.2%}' for p in probs]})",
            agent="rl_brain",
        )

        return RLSignal(
            action=action_str,
            action_id=action_id,
            confidence=confidence,
            raw_probs=probs.tolist(),
            obs=obs.tolist(),
        )

    def sample_observation(self) -> np.ndarray:
        """Convenience: reset env and return a fresh observation."""
        obs, _ = self.env.reset()
        return obs
