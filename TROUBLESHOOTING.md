# 🔧 Troubleshooting: "Command not found" Error

## Problem Fixed ✅

The issue with `command 'storyteller.traceVariable' not found` has been resolved. Here's what was changed and how to install the updated version:

## 🎯 What Was Fixed

1. **Activation Events**: Changed from specific command activation to `"*"` (immediate activation)
2. **Added Keybindings**: Commands now have keyboard shortcuts
3. **Enhanced Menu Integration**: Better command palette and context menu support

## 🚀 Updated Installation Steps

### Step 1: Install the New VSIX Package
```bash
# The new package has been created: dynamic-code-storyteller-0.0.1.vsix
```

1. **Uninstall the old version** (if installed):
   - Go to Extensions view (`Cmd+Shift+X`)
   - Find "Dynamic Code & Data Storyteller"
   - Click the gear icon → "Uninstall"

2. **Install the new version**:
   - In Extensions view, click `...` → "Install from VSIX..."
   - Select the new `dynamic-code-storyteller-0.0.1.vsix` file
   - **Restart VS Code** after installation

### Step 2: Verify Installation

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Type "Code Storyteller"** - you should see:
   - ✅ `Code Storyteller: Trace Variable`
   - ✅ `Code Storyteller: Show Call Graph`
   - ✅ `Code Storyteller: What-If Analysis`
   - ✅ `Code Storyteller: Open Visualization Panel`

## ⌨️ New Keyboard Shortcuts

| Command | macOS | Windows/Linux |
|---------|-------|---------------|
| Trace Variable | `Cmd+Alt+T` | `Ctrl+Alt+T` |
| Show Call Graph | `Cmd+Alt+G` | `Ctrl+Alt+G` |
| What-If Analysis | `Cmd+Alt+W` | `Ctrl+Alt+W` |
| Open Visualization | `Cmd+Alt+V` | `Ctrl+Alt+V` |

## 🧪 Test the Extension

### Quick Test Steps:

1. **Open a JavaScript/TypeScript file**
2. **Select a variable name** in the code
3. **Try any of these methods**:
   - Press `Cmd+Alt+T` (keyboard shortcut)
   - Right-click → "Trace Variable" (context menu)
   - Command Palette → "Code Storyteller: Trace Variable"

4. **You should see**: "Started tracing variable: [variable_name]"

## 🔍 If Commands Still Don't Work

### Check Extension Status:
1. Go to Extensions view (`Cmd+Shift+X`)
2. Search for "Dynamic Code"
3. Verify it shows as "Installed" and "Enabled"

### Check Developer Console:
1. Help → "Toggle Developer Tools"
2. Look for any error messages in the Console tab
3. Check if you see: "Dynamic Code & Data Storyteller extension is now active!"

### Force Reload:
1. Press `Cmd+Shift+P`
2. Run "Developer: Reload Window"
3. Try the commands again

## 🐛 Alternative Installation Methods

### Method 1: Development Mode (Most Reliable)
```bash
cd /Users/Gagan/Code/vibe/code-dynamic-story-plugin
code .
# Press F5 to launch Extension Development Host
```

### Method 2: Manual Installation
```bash
code --install-extension dynamic-code-storyteller-0.0.1.vsix
```

## ✅ Expected Behavior After Fix

- ✅ Commands appear in Command Palette immediately
- ✅ Keyboard shortcuts work in any editor
- ✅ Right-click context menu shows "Trace Variable" when text is selected
- ✅ Extension activates immediately when VS Code starts
- ✅ No more "command not found" errors

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Check VS Code version**: Ensure you're using VS Code 1.74.0 or later
2. **Check the Output panel**: View → Output → Select "Dynamic Code & Data Storyteller"
3. **Try in a clean workspace**: Open a new window with a simple JavaScript file
4. **Check conflicting extensions**: Disable other debugging/visualization extensions temporarily

The extension should now work correctly with all commands accessible through multiple methods!
