# Voice Intake / AI Telephony
Last updated: 2026-04-25 03:17 UTC
Status: active working draft

## Purpose
This domain folder captures the target-state operating model for inbound phone calls, IVR routing, call recording/transcription, AI voice handling, CRM writeback, and human escalation.

## Main Documents
- `process-truth.md` — target-state architecture and operating rules for voice intake

## References
- `references/ai-voice-platform-recommendation-2026-04-25.md` — platform recommendation and design direction

## Status
- Initial platform recommendation captured
- Twilio selected as the strongest long-term platform foundation for custom AI voice agents linked to iCorrect knowledge
- Aircall retained as the strongest near-term operational bridge if a fast stopgap is needed

## Next Steps
- Define call reason taxonomy and mandatory post-call outcomes
- Define CRM / Intercom / intake-system writeback requirements
- Define human-handoff rules from AI -> Ferrari / Naheed / office team
- Define legal/compliance policy for call recording, retention, access, and deletion
- Decide whether the business wants a bridge system first or direct Twilio build

## Outputs To Create
### SOP backlog
- intake-call handling SOP
- missed-call callback SOP
- AI-to-human escalation SOP
- call-recording retention and access SOP

### KB backlog
- phone call stage definitions
- call reason taxonomy
- voice-intake routing rules
- call logging requirements
