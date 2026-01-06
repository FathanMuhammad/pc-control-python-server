import ctypes
from flask import Flask, jsonify, send_from_directory, request
import subprocess
import platform
import os
import time
import pyautogui
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
from comtypes import CLSCTX_ALL
from ctypes import cast, POINTER, windll, wintypes
import threading

app = Flask(__name__)

# Initialize volume control for Windows
def get_volume_controller():
    devices = AudioUtilities.GetSpeakers()
    interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
    volume = cast(interface, POINTER(IAudioEndpointVolume))
    return volume

try:
    volume_controller = get_volume_controller()
except:
    volume_controller = None
    print("Warning: Volume control not available")

# Throttle settings for mouse moves (milliseconds)
MOVE_MIN_GAP_MS = 90
_last_move_time = 0
_last_move_lock = threading.Lock()
# Max delta per move to avoid accidental large jumps
MAX_MOVE_DELTA = 300

def get_system():
    return platform.system()

def execute_command(cmd):
    """Execute system command safely"""
    try:
        subprocess.Popen(cmd, shell=True)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

@app.route('/')
def index():
    return send_from_directory('.', 'remote.html')

###############################################
##### REMOTE NETFLIX
###############################################
@app.route('/api/pause', methods=['POST'])
def pause():
    pyautogui.press('playpause')
    return jsonify({"action": "pause"})

@app.route('/api/next', methods=['POST'])
def next_track():
    pyautogui.press('right')
    return jsonify({"action": "next"})

@app.route('/api/back', methods=['POST'])
def prev_track():
    pyautogui.press('left')
    return jsonify({"action": "back"})

@app.route('/api/volup', methods=['POST'])
def vol_up():
    pyautogui.press('volumeup', presses=1, interval=0.1)
    return jsonify({"action": "volup"})

@app.route('/api/voldown', methods=['POST'])
def vol_down():
    pyautogui.press('volumedown', presses=1, interval=0.1)
    return jsonify({"action": "voldown"})

@app.route('/api/skipintro', methods=['POST'])
def skip_intro():
    pyautogui.press('s')
    return jsonify({"action": "skipintro"})

@app.route('/api/nextepisode', methods=['POST'])
def next_episode():
    pyautogui.press('tab')
    time.sleep(0.1)
    pyautogui.press('tab')
    time.sleep(0.1)
    pyautogui.press('enter')
    return jsonify({"action": "nextepisode"})

###############################################
##### MOUSE CONTROL
###############################################
@app.route('/api/mouse/move', methods=['POST'])
def mouse_move():
    """Move mouse cursor - server-side throttling + clamp to prevent double/two-step jumps"""
    global _last_move_time
    data = request.get_json()
    try:
        dx = int(data.get('dx', 0))
        dy = int(data.get('dy', 0))
    except Exception:
        return jsonify({"action": "mouse_move", "error": "invalid dx/dy"}), 400

    # Clamp per-move delta
    dx = max(-MAX_MOVE_DELTA, min(MAX_MOVE_DELTA, dx))
    dy = max(-MAX_MOVE_DELTA, min(MAX_MOVE_DELTA, dy))

    # Throttle to avoid double-move on quick taps
    now_ms = int(time.time() * 1000)
    with _last_move_lock:
        if now_ms - _last_move_time < MOVE_MIN_GAP_MS:
            # Skip this move because it's too soon after previous move
            return jsonify({"action": "mouse_move", "skipped": True, "reason": "throttled"})
        _last_move_time = now_ms

    current_x, current_y = pyautogui.position()
    new_x = current_x + dx
    new_y = current_y + dy

    screen_width, screen_height = pyautogui.size()
    new_x = max(0, min(screen_width - 1, new_x))
    new_y = max(0, min(screen_height - 1, new_y))

    pyautogui.moveTo(new_x, new_y, duration=0)

    return jsonify({"action": "mouse_move", "skipped": False})

@app.route('/api/mouse/click', methods=['POST'])
def mouse_click():
    """Perform mouse click"""
    data = request.get_json()
    button = data.get('button', 'left')
    
    pyautogui.click(button=button)
    
    return jsonify({"action": "mouse_click", "button": button})

@app.route('/api/mouse/scroll', methods=['POST'])
def mouse_scroll():
    """Scroll mouse wheel"""
    data = request.get_json()
    amount = int(data.get('amount', 0))
    
    pyautogui.scroll(amount * 50)
    
    return jsonify({"action": "mouse_scroll"})

###############################################
##### APLIKASI
###############################################
@app.route('/api/open/spotify', methods=['POST'])
def open_spotify():
    system = get_system()
    if system == "Windows":
        try:
            execute_command("start spotify:")
        except:
            execute_command(r'start "" "C:\Users\%USERNAME%\AppData\Roaming\Spotify\Spotify.exe"')
    else:
        execute_command("spotify &")
    
    return jsonify({"action": "open_spotify"})

@app.route('/api/open/dimmer', methods=['POST'])
def open_dimmer():
    system = get_system()
    if system == "Windows":
        try:
            execute_command(r'start "" ""D:\Windows\WINDOWS\dimmer_v2.0.1\Dimmer.exe""')
        except:
            execute_command(r'start "" ""D:\Windows\WINDOWS\dimmer_v2.0.1\Dimmer.exe""')
    else:
        execute_command(r'start "" ""D:\Windows\WINDOWS\dimmer_v2.0.1\Dimmer.exe""')
    
    return jsonify({"action": "open_dimmer"})


@app.route('/api/close/dimmer', methods=['POST'])
def close_dimmer():
    system = get_system()
    results = []
    try:
        if system == "Windows":
            # initial check
            try:
                out = subprocess.check_output('tasklist /FI "IMAGENAME eq Dimmer.exe"', shell=True, text=True, stderr=subprocess.STDOUT)
            except subprocess.CalledProcessError as e:
                out = e.output or ''
            results.append({'tasklist_before': out.strip()[:2000]})

            if 'Dimmer.exe' in out:
                # Try graceful close
                try:
                    subprocess.check_call('taskkill /IM Dimmer.exe', shell=True)
                    results.append({'graceful_kill': 'ok'})
                except subprocess.CalledProcessError as e:
                    results.append({'graceful_kill': 'failed', 'error': str(e)})
                    # Fall back to force kill with tree
                    try:
                        subprocess.check_call('taskkill /IM Dimmer.exe /F /T', shell=True)
                        results.append({'force_kill': 'ok'})
                    except Exception as e2:
                        results.append({'force_kill': 'failed', 'error': str(e2)})

                # Also attempt PowerShell Stop-Process by wildcard name
                try:
                    subprocess.check_call('powershell -Command "Get-Process -Name *dimmer* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"', shell=True)
                    results.append({'powershell_stop': 'ok'})
                except Exception as e:
                    results.append({'powershell_stop': 'failed', 'error': str(e)})
            else:
                results.append({'status': 'not_running'})

            # final check
            try:
                final = subprocess.check_output('tasklist /FI "IMAGENAME eq Dimmer.exe"', shell=True, text=True, stderr=subprocess.STDOUT)
            except subprocess.CalledProcessError as e:
                final = e.output or ''
            results.append({'tasklist_after': final.strip()[:2000]})

            still_running = 'Dimmer.exe' in final

            if not still_running:
                return jsonify({"action": "close_dimmer", "closed": True, "details": results})
            else:
                # best-effort: try to reset brightness to 100% via WMI (may fail on some setups)
                try:
                    subprocess.check_call('powershell -Command "(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue).WmiSetBrightness(1,100)"', shell=True)
                    results.append({'brightness_reset': 'ok'})
                except Exception as e:
                    results.append({'brightness_reset': 'failed', 'error': str(e)})

                return jsonify({"action": "close_dimmer", "closed": False, "still_running": True, "details": results}), 500
        else:
            # Unix-like: attempt pkill and report
            try:
                subprocess.check_call('pkill -f dimmer || true', shell=True)
                return jsonify({"action": "close_dimmer", "closed": True})
            except Exception as e:
                return jsonify({"action": "close_dimmer", "closed": False, "error": str(e)}), 500
    except Exception as e:
        return jsonify({"action": "close_dimmer", "closed": False, "error": str(e), "details": results}), 500


@app.route('/api/open/netflix', methods=['POST'])
def open_netflix():
    system = get_system()
    if system == "Windows":
        execute_command('start msedge "https://www.netflix.com"')
    else:
        execute_command('xdg-open "https://www.netflix.com"')
    
    return jsonify({"action": "open_netflix"})

@app.route('/api/open/youtube', methods=['POST'])
def open_youtube():
    system = get_system()
    if system == "Windows":
        execute_command('start msedge "https://www.youtube.com"')
    else:
        execute_command('xdg-open "https://www.youtube.com"')
    
    return jsonify({"action": "open_youtube"})

###############################################
##### KEYBOARD CONTROL
###############################################
@app.route('/api/keyboard/type', methods=['POST'])
def keyboard_type():
    """Type text instantly"""
    data = request.get_json()
    text = data.get('text', '')
    
    if text:
        pyautogui.write(text, interval=0.01)
    
    return jsonify({"action": "keyboard_type", "text": text})

@app.route('/api/keyboard/backspace', methods=['POST'])
def keyboard_backspace():
    """Press backspace key"""
    pyautogui.press('backspace')
    return jsonify({"action": "keyboard_backspace"})

@app.route('/api/keyboard/enter', methods=['POST'])
def keyboard_enter():
    """Press enter key"""
    pyautogui.press('enter')
    return jsonify({"action": "keyboard_enter"})

@app.route('/api/keyboard/alt_d', methods=['POST'])
def keyboard_alt_d():
    """Press Alt+D (focus address bar)"""
    pyautogui.hotkey('alt', 'd')
    return jsonify({"action": "alt_d"})

@app.route('/api/keyboard/alt_left', methods=['POST'])
def keyboard_alt_left():
    """Press Alt+Left Arrow (commonly used for back/jump)"""
    pyautogui.hotkey('alt', 'left')
    return jsonify({"action": "alt_left"})


@app.route('/api/keyboard/ctrl_plus', methods=['POST'])
def keyboard_ctrl_plus():
    """Press Ctrl + (Zoom in) - uses Ctrl + '=' for compatibility"""
    try:
        pyautogui.keyDown('ctrl')
        pyautogui.press('=')
        pyautogui.keyUp('ctrl')
        return jsonify({"action": "ctrl_plus"})
    except Exception as e:
        return jsonify({"action": "ctrl_plus", "error": str(e)}), 500


@app.route('/api/keyboard/ctrl_minus', methods=['POST'])
def keyboard_ctrl_minus():
    """Press Ctrl - (Zoom out)"""
    try:
        pyautogui.hotkey('ctrl', '-')
        return jsonify({"action": "ctrl_minus"})
    except Exception as e:
        return jsonify({"action": "ctrl_minus", "error": str(e)}), 500

@app.route('/api/keyboard/windows_tab', methods=['POST'])
def keyboard_windows_tab():
    """Press Windows+Tab (Task View)"""
    pyautogui.hotkey('win', 'tab')
    return jsonify({"action": "windows_tab"})

@app.route('/api/keyboard/windows_p', methods=['POST'])
def keyboard_windows_p():
    """Press Windows+P (Project menu)"""
    pyautogui.hotkey('win', 'p')
    return jsonify({"action": "windows_p"})
    
@app.route('/api/keyboard/toggle_bluetooth', methods=['POST'])
def keyboard_toggle_bluetooth():
    """Toggle Bluetooth using Win+A, Right Arrow, Enter"""
    system = get_system()
    if system == "Windows":
        try:
            # Open Action Center (Win + A)
            pyautogui.hotkey('win', 'a')
            time.sleep(0.8)  # Wait for Action Center to open
            
            # Press Right Arrow to navigate to Bluetooth tile
            pyautogui.press('right')
            time.sleep(0.2)
            
            # Press Enter to toggle Bluetooth
            pyautogui.press('enter')
            time.sleep(0.5)
            
            # Close Action Center with ESC
            pyautogui.press('esc')
            
            return jsonify({"action": "toggle_bluetooth", "method": "win_a_right_enter"})
        except Exception as e:
            print(f"Bluetooth toggle error: {e}")
            return jsonify({"action": "toggle_bluetooth", "error": str(e)})
    else:
        return jsonify({"action": "toggle_bluetooth", "error": "Windows only"})

###############################################
##### SHUTDOWN PC
###############################################
@app.route('/api/shutdown', methods=['POST'])
def shutdown():
    timer = request.args.get('time', '60')
    system = get_system()
    
    if system == "Windows":
        execute_command(f"shutdown /s /t {timer}")
    else:
        execute_command(f"shutdown -h +{int(timer)//60}")
    
    return jsonify({"action": "shutdown", "timer": timer})

def get_local_ip():
    """Get local IP address"""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"
    
def init_windows_input():
    """
    Fully initialize Windows input so mouse works immediately
    after boot / wake / unlock
    """
    try:
        time.sleep(2)

        # 2. Keyboard event (fallback)
        pyautogui.press('shift')

        # 3. PyAutoGUI mouse nudge
        pyautogui.moveRel(2, 0, duration=0)
        pyautogui.moveRel(-2, 0, duration=0)

        # 4. Force cursor visible
        windll.user32.ShowCursor(True)

        print("[OK] Windows input fully initialized")
    except Exception as e:
        print(f"[WARN] Input init failed: {e}")

        
if __name__ == '__main__':
    local_ip = get_local_ip()
    print("\n" + "="*60)
    print("PC Remote Control Server")
    print("="*60)
    print(f"\nAccess from your phone:")
    print(f"   http://nuhi.local:5000")
    print(f"   http://{local_ip}:5000")
    print(f"\nLocal access:")
    print(f"   http://localhost:5000")
    print("\nMake sure your phone and PC are on the same network!")
    print("="*60 + "\n")

    pyautogui.FAILSAFE = False

    # INI SOLUSINYA
    init_windows_input()

    app.run(host='0.0.0.0', port=5000, debug=False)