# Offline Testing Guide

## Quick Start

Run the offline test mode:
```bash
npm test
```

## Testing Scenarios

### 1. Test Main Menu Navigation
```
You: hello
Bot: [Shows main menu]

You: 1
Bot: [Enters conversation mode]

You: menu
Bot: [Returns to main menu]
```

### 2. Test Chat History
```
You: 2
Bot: [Shows history menu]

You: 1
Bot: [Shows full history]

You: back
Bot: [Returns to main menu]
```

### 3. Test Conversation Mode
```
You: chat
Bot: [Enters conversation mode]

You: Hello world!
Bot: [Responds with conversation]

You: How are you?
Bot: [Another conversation response]

You: history
Bot: [Shows recent chat history]
```

### 4. Test Rejoin Feature
```
You: 3
Bot: [Shows rejoin message with recent history]

[Continue chatting from where you left off]
```

### 5. Test History Management
```
You: 2
Bot: [History menu]

You: 3
Bot: [Clears history and returns to main menu]
```

## Expected Commands

- **Numbers**: `1`, `2`, `3` - Navigate menu options
- **Keywords**: `chat`, `history`, `rejoin` - Alternative navigation
- **Special**: `menu`, `back`, `clear` - Navigation commands
- **Exit**: `exit` - Quit the test session

## Test Data

- Chat sessions are saved to `test-chat-sessions.json`
- Each test session maintains separate history
- Timestamps and message counts are tracked
- All menu flows and conversation modes are testable

## Verification Points

✅ Main menu displays correctly
✅ All menu options work (1, 2, 3)
✅ Conversation mode responds to messages
✅ Chat history saves and displays
✅ Rejoin feature shows previous messages
✅ Navigation commands work (`menu`, `back`)
✅ History clearing works
✅ Session persistence between interactions