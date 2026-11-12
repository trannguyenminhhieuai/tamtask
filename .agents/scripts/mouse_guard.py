import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path

# Load config or API key
API_KEY = os.environ.get("MOUSE_API_KEY")

if not API_KEY:
    # Try finding .mouse_config.json relative to this script
    script_dir = Path(__file__).resolve().parent
    config_file = script_dir.parent / ".mouse_config.json"
    if not config_file.exists():
        config_file = script_dir / ".mouse_config.json"
    
    if config_file.exists():
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                API_KEY = cfg.get("apiKey")
        except Exception:
            pass

def respond(decision="allow", reason=None):
    resp = {"decision": decision}
    if reason:
        resp["reason"] = reason
    print(json.dumps(resp))
    sys.exit(0)

def main():
    try:
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            respond("allow")
        
        hook_payload = json.loads(raw_input)
    except Exception as e:
        # Fallback to allow if stdin cannot be parsed
        respond("allow")

    if not API_KEY:
        # If no API key configured, pass through
        respond("allow")

    tool_call = hook_payload.get("toolCall", {})
    tool_name = tool_call.get("name", "unknown_tool")
    tool_args = tool_call.get("args", {})

    # Build Mouse-1 Safeguard request
    safeguards_payload = {
        "model": "mouse-1",
        "rules": {
            "hard_deny": [
                "Delete or drop database tables or production collections",
                "Expose raw secrets, API keys, credentials, or .env file content",
                "Execute dangerous system-level commands (e.g., rm -rf /, formatting disks, fork bombs)"
            ],
            "soft_deny": [
                "Push changes directly to main/master remote git branches",
                "Publish packages to public registries (npm, pypi, cargo)",
                "Modify system-wide OS configuration outside workspace"
            ],
            "allow": [
                "Inspect, view, read, and search files in the workspace",
                "Edit and create code files, documentation, and tests in workspace",
                "Run standard local development commands (npm, pip, python, pytest, git status/diff)"
            ]
        },
        "messages": [
            {"role": "user", "content": "Execute developer tools safely inside the local workspace"}
        ],
        "tool_uses": [
            {
                "id": f"antigravity_{tool_name}",
                "name": tool_name,
                "input": tool_args
            }
        ],
        "timeout_ms": 3000
    }

    req = urllib.request.Request(
        "https://api.mouse.dev/v1/safeguards",
        data=json.dumps(safeguards_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            
            # Inspect mouse safeguard decision
            mouse_meta = data.get("mouse", {})
            tool_decisions = mouse_meta.get("tool_uses", {})
            call_info = tool_decisions.get(f"antigravity_{tool_name}", {})
            
            decision = call_info.get("decision", "none")
            rule = call_info.get("rule", "")
            
            # If Mouse-1 flagged this tool use
            if decision == "hard_deny":
                explanation = "Hard security rule triggered: " + (rule or "Dangerous action detected")
                respond(decision="deny", reason=f"[Mouse-1 Guard BLOCKED]: {explanation}")
            elif decision == "soft_deny":
                explanation = "Security precaution rule triggered: " + (rule or "Sensitive action detected")
                respond(decision="ask", reason=f"[Mouse-1 Guard Review]: {explanation}")
            else:
                respond("allow")

    except Exception as e:
        # On network failure or timeout, gracefully allow or log
        sys.stderr.write(f"Mouse-1 Safeguard check failed: {e}\n")
        respond("allow")

if __name__ == "__main__":
    main()
