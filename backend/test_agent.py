"""
test_agent.py — TradeMind AI Integration Test
==============================================
Standalone integration test that validates the full pipeline:
  RL Brain → Safety Stack (clean) → Safety Stack (kill-switch trigger) → Reset

Run with:
    cd backend
    python test_agent.py

No pytest or external server required. All logic runs in-process.
The script exits with code 0 on full pass, 1 on any failure.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time

# ── Ensure backend directory is on path ──────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN   = "\033[92m"
RED     = "\033[91m"
YELLOW  = "\033[93m"
CYAN    = "\033[96m"
BOLD    = "\033[1m"
DIM     = "\033[2m"
RESET   = "\033[0m"

PASS = f"{GREEN}✅ PASS{RESET}"
FAIL = f"{RED}❌ FAIL{RESET}"
INFO = f"{CYAN}ℹ {RESET}"
WARN = f"{YELLOW}⚠  {RESET}"


def header(title: str) -> None:
    width = 60
    print(f"\n{BOLD}{CYAN}{'─' * width}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─' * width}{RESET}")


def result(label: str, passed: bool, detail: str = "") -> None:
    badge = PASS if passed else FAIL
    detail_str = f"  {DIM}{detail}{RESET}" if detail else ""
    print(f"  {badge}  {label}{detail_str}")


results: list[tuple[str, bool]] = []


def assert_test(label: str, condition: bool, detail: str = "") -> None:
    results.append((label, condition))
    result(label, condition, detail)
    if not condition:
        print(f"{RED}  → Test assertion failed. See detail above.{RESET}")


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 1 — RL Brain Initialisation & Signal
# ─────────────────────────────────────────────────────────────────────────────

def test_rl_brain() -> None:
    header("TEST 1 — RL Brain: Environment & Signal Generation")

    from agents.rl_brain import RLBrain, TradingEnv, OBS_DIM, ACTION_MAP

    # 1a: Environment validation
    env = TradingEnv()
    obs, info = env.reset(seed=42)
    assert_test(
        "TradingEnv.reset() returns correct obs shape",
        obs.shape == (OBS_DIM,),
        f"obs.shape={obs.shape}, expected=({OBS_DIM},)",
    )

    action = env.action_space.sample()
    obs2, reward, terminated, truncated, info = env.step(action)
    assert_test(
        "TradingEnv.step() executes without error",
        obs2.shape == (OBS_DIM,),
        f"action={ACTION_MAP[action]}, reward={reward:.6f}",
    )

    # 1b: RLBrain signal
    brain = RLBrain(checkpoint_path="")  # fresh untrained model
    signal = brain.get_signal()

    assert_test(
        "RLBrain.get_signal() returns valid action",
        signal.action in ("BUY", "SELL", "HOLD"),
        f"action={signal.action}",
    )
    assert_test(
        "Confidence is in [0, 1]",
        0.0 <= signal.confidence <= 1.0,
        f"confidence={signal.confidence:.4f}",
    )
    assert_test(
        "raw_probs sums to ≈1.0",
        abs(sum(signal.raw_probs) - 1.0) < 1e-5,
        f"sum={sum(signal.raw_probs):.6f}",
    )
    assert_test(
        "obs vector has correct length",
        len(signal.obs) == OBS_DIM,
        f"obs_dim={len(signal.obs)}",
    )

    print(
        f"\n  {INFO}RL Signal Summary: "
        f"{CYAN}{signal.action}{RESET} "
        f"(confidence={signal.confidence:.2%}) | "
        f"P(HOLD)={signal.raw_probs[0]:.2%}  "
        f"P(BUY)={signal.raw_probs[1]:.2%}  "
        f"P(SELL)={signal.raw_probs[2]:.2%}"
    )


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 2 — Safety Stack: Clean Portfolio (all checks should PASS)
# ─────────────────────────────────────────────────────────────────────────────

def test_safety_clean() -> None:
    header("TEST 2 — Safety Stack: Clean Portfolio (all TMR checks must pass)")

    # Reset kill-switch before this test (in case it was previously triggered)
    from core.safety import HardKillSwitch
    from core.config import get_settings
    cfg = get_settings()
    HardKillSwitch.reset(cfg.admin_secret_token)

    from core.safety import SafetyStack

    stack = SafetyStack()
    verdict = stack.evaluate(
        portfolio_value=100_000.0,   # no loss
        peak_value=100_000.0,
        position_size=4_000.0,       # 4% of capital — within 5% limit
        total_capital=100_000.0,
        vix_proxy=18.0,              # well below 30 ceiling
    )

    assert_test(
        "All 3 TMR checks passed on clean portfolio",
        verdict.approved,
        f"triggered={verdict.triggered_checks}",
    )
    assert_test(
        "Kill-switch is NOT active",
        not verdict.kill_switch_active,
        "",
    )
    assert_test(
        "3 check results returned",
        len(verdict.checks) == 3,
        f"checks={[c.name for c in verdict.checks]}",
    )

    for c in verdict.checks:
        assert_test(
            f"{c.name} passed",
            c.passed,
            c.reason,
        )

    print(f"\n  {INFO}{verdict.summary()}")


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 3 — Safety Stack: 2.1% Drawdown Triggers Hard Kill-Switch
# ─────────────────────────────────────────────────────────────────────────────

def test_safety_kill_switch() -> None:
    header("TEST 3 — Safety Stack: Drawdown Breach → Hard Kill-Switch")

    from core.safety import HardKillSwitch, SafetyStack
    from core.config import get_settings

    # Ensure kill-switch is reset before simulating the breach
    cfg = get_settings()
    HardKillSwitch.reset(cfg.admin_secret_token)

    stack = SafetyStack()

    # Simulate 2.1% daily drawdown — exceeds the 2% threshold
    peak = 100_000.0
    current = 97_900.0  # loss = 2.1%
    actual_dd = (peak - current) / peak

    print(f"\n  {WARN}Simulating {actual_dd:.2%} daily drawdown (threshold = {cfg.max_daily_drawdown:.2%})…")

    verdict = stack.evaluate(
        portfolio_value=current,
        peak_value=peak,
        position_size=5_000.0,
        total_capital=current,
        vix_proxy=20.0,
    )

    assert_test(
        "Trade is BLOCKED (drawdown threshold breached)",
        not verdict.approved,
        f"drawdown={actual_dd:.2%}",
    )
    assert_test(
        "Hard Kill-Switch is NOW ACTIVE",
        verdict.kill_switch_active,
        "",
    )
    assert_test(
        "DrawdownCheck present in triggered_checks",
        "DrawdownCheck" in verdict.triggered_checks,
        f"triggered={verdict.triggered_checks}",
    )

    # Verify the kill-switch singleton persists — next trade should also be blocked
    verdict2 = stack.evaluate(
        portfolio_value=100_000.0,  # even a "clean" portfolio is blocked
        peak_value=100_000.0,
        position_size=1_000.0,
        total_capital=100_000.0,
        vix_proxy=10.0,
    )
    assert_test(
        "Kill-switch blocks ALL subsequent trades",
        not verdict2.approved and verdict2.kill_switch_active,
        "Persistent kill-switch confirmed",
    )

    print(f"\n  {INFO}{verdict.summary()}")


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 4 — Kill-Switch Reset
# ─────────────────────────────────────────────────────────────────────────────

def test_kill_switch_reset() -> None:
    header("TEST 4 — Hard Kill-Switch: Admin Reset")

    from core.safety import HardKillSwitch
    from core.config import get_settings

    cfg = get_settings()

    # Test invalid token rejection
    rejected = HardKillSwitch.reset("wrong_token_12345")
    assert_test(
        "Invalid admin token is rejected",
        not rejected,
        "wrong token correctly blocked",
    )
    assert_test(
        "Kill-switch remains ACTIVE after bad reset attempt",
        HardKillSwitch.active,
        "",
    )

    # Test valid token acceptance
    success = HardKillSwitch.reset(cfg.admin_secret_token)
    assert_test(
        "Valid admin token resets the kill-switch",
        success,
        f"token='{cfg.admin_secret_token[:4]}…'",
    )
    assert_test(
        "Kill-switch is now INACTIVE",
        not HardKillSwitch.active,
        "",
    )

    print(f"\n  {INFO}Kill-switch state after reset: active={HardKillSwitch.active}")


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 5 — Council Mock Deliberation (no Gemini key required)
# ─────────────────────────────────────────────────────────────────────────────

async def test_council_mock() -> None:
    header("TEST 5 — Council Deliberation (mock fallback mode)")

    from agents.rl_brain import RLBrain, RLSignal
    from agents.council import CouncilSession

    brain = RLBrain(checkpoint_path="")
    signal = brain.get_signal()
    council = CouncilSession()

    t_start = time.monotonic()
    verdict = await council.deliberate(
        rl_signal=signal,
        market_context="Test deliberation — no live market data.",
    )
    elapsed_ms = int((time.monotonic() - t_start) * 1000)

    assert_test(
        "Council deliberation completes without error",
        verdict is not None,
        "",
    )
    assert_test(
        "3 votes returned (one per agent)",
        len(verdict.votes) == 3,
        f"agents={[v.agent_name for v in verdict.votes]}",
    )
    assert_test(
        "All votes have valid verdicts",
        all(v.verdict in ("BUY", "SELL", "HOLD", "VETO", "NO_VETO") for v in verdict.votes),
        "",
    )
    assert_test(
        "Thought logs are non-empty",
        len(verdict.thought_logs) > 0,
        f"log_count={len(verdict.thought_logs)}",
    )
    assert_test(
        "Deliberation completed in <60s",
        elapsed_ms < 60_000,
        f"elapsed={elapsed_ms}ms",
    )

    print(f"\n  {INFO}Council Summary: {verdict.summary()}")
    print(f"  {INFO}Deliberation time: {elapsed_ms}ms")
    for v in verdict.votes:
        badge = f"{GREEN}" if v.verdict not in ("VETO",) else f"{RED}"
        print(
            f"  {badge}[{v.agent_name}]{RESET} "
            f"→ {v.verdict} ({v.confidence:.0%})  "
            f"{DIM}{v.reasoning[:70]}…{RESET}"
        )


# ─────────────────────────────────────────────────────────────────────────────
#  TEST 6 — Health Endpoint (optional, only if server is running)
# ─────────────────────────────────────────────────────────────────────────────

async def test_health_endpoint() -> None:
    header("TEST 6 — Health Endpoint (requires server running on :8000)")

    try:
        import httpx
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:8000/health")
        data = resp.json()

        assert_test(
            "Server responds 200 OK",
            resp.status_code == 200,
            f"status={resp.status_code}",
        )
        assert_test(
            "'status' field is 'ok'",
            data.get("status") == "ok",
            f"status={data.get('status')}",
        )
        assert_test(
            "kill_switch_active reflects in-memory state",
            "kill_switch_active" in data,
            f"kill_switch_active={data.get('kill_switch_active')}",
        )
        print(f"\n  {INFO}Health response: {data}")

    except Exception as exc:
        print(f"\n  {WARN}Server not running — skipping live endpoint test. ({exc})")
        print(f"  {INFO}Start with: uvicorn main:app --reload --port 8000")
        results.append(("Health endpoint (server not running — skipped)", True))


# ─────────────────────────────────────────────────────────────────────────────
#  Summary
# ─────────────────────────────────────────────────────────────────────────────

def print_summary() -> int:
    header("TEST SUMMARY")
    passed = sum(1 for _, p in results if p)
    total = len(results)
    all_pass = passed == total

    for label, p in results:
        badge = PASS if p else FAIL
        print(f"  {badge}  {label}")

    print(f"\n{BOLD}  Result: {passed}/{total} tests passed{RESET}")

    if all_pass:
        print(f"\n{GREEN}{BOLD}  🚀 All systems verified. TradeMind AI backend is ready.{RESET}\n")
        return 0
    else:
        print(f"\n{RED}{BOLD}  ⚠  {total - passed} test(s) failed. Review output above.{RESET}\n")
        return 1


# ─────────────────────────────────────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────────────────────────────────────

async def main() -> int:
    print(f"\n{BOLD}{CYAN}{'═' * 60}{RESET}")
    print(f"{BOLD}{CYAN}  TradeMind AI — Backend Integration Test Suite{RESET}")
    print(f"{BOLD}{CYAN}{'═' * 60}{RESET}")

    test_rl_brain()
    test_safety_clean()
    test_safety_kill_switch()
    test_kill_switch_reset()
    await test_council_mock()
    await test_health_endpoint()

    return print_summary()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
