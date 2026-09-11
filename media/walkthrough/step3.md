### Feed Dusty an Error 🐛

Dusty hunts syntax errors in your active editor.

Try introducing a safe disposable syntax error:
```typescript
const message = "Hello world";; // Note the duplicate semicolon!
```

Dusty will detect the diagnostic, target the line, and prepare to vacuum!
