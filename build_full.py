# build_full.py
import PyInstaller.__main__
import os

# Get current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

PyInstaller.__main__.run([
    'app.py',
    '--onefile',
    '--noconsole',
    '--name=PC_Remote_Control',
    f'--add-data=remote.html{os.pathsep}.',
    '--hidden-import=flask',
    '--hidden-import=werkzeug',
    '--hidden-import=jinja2',
    '--hidden-import=pyautogui',
    '--hidden-import=pycaw.pycaw',
    '--hidden-import=comtypes',
    '--hidden-import=comtypes.gen',
    '--hidden-import=pycaw',
    '--hidden-import=pynput',  # if pyautogui uses it
    '--hidden-import=pillow',  # if pyautogui uses it
    '--collect-all=pycaw',
    '--collect-all=comtypes',
])