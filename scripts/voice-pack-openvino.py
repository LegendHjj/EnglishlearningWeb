"""Persistent local OpenVINO CPU adapter for the exact pinned Kokoro ONNX model."""
import base64
import atexit
import ctypes
import json
import pathlib
import sys

folder = pathlib.Path(sys.argv[1]).resolve()
if sys.platform == 'win32':
    # Keep this explicitly requested long job running through automatic idle sleep.
    # Display sleep stays unchanged; the OS also releases the request on exit.
    ctypes.windll.kernel32.SetThreadExecutionState(ctypes.c_uint(0x80000001))
    atexit.register(lambda: ctypes.windll.kernel32.SetThreadExecutionState(ctypes.c_uint(0x80000000)))
sys.path.insert(0, str(folder / 'openvino-runtime'))
import numpy as np
import openvino as ov

source = folder / 'model-cache/onnx-community/Kokoro-82M-v1.0-ONNX/1939ad2a8e416c0acfeecc08a694d14ef25f2231/onnx/model.onnx'
core = ov.Core()
# Bound shape-specific CPU primitives: the default 5000-entry cache retained
# over 15 GiB with this variable-length speech corpus on the target machine.
# This internal setting is verified against the isolated OpenVINO 2026.4.1 runtime.
core.set_property('CPU', {'CPU_RUNTIME_CACHE_CAPACITY':64})
model = core.read_model(str(source))
compiled = core.compile_model(model, 'CPU', {'PERFORMANCE_HINT':'LATENCY', 'NUM_STREAMS':'1', 'INFERENCE_NUM_THREADS':int(sys.argv[2]), 'INFERENCE_PRECISION_HINT':'f32', 'CACHE_DIR':str(folder / 'openvino-cache')})
output = compiled.output('waveform')
print(json.dumps({'type':'ready','version':ov.__version__}), flush=True)
for line in sys.stdin:
    request = json.loads(line)
    try:
        inputs = {'input_ids':np.array(request['input_ids'],dtype=np.int64).reshape(1,-1), 'style':np.array(request['style'],dtype=np.float32).reshape(1,256), 'speed':np.array(request['speed'],dtype=np.float32).reshape(1)}
        result = compiled(inputs)
        audio = np.array(result[output],dtype=np.float32).reshape(-1)
        if not audio.size or not np.isfinite(audio).all():
            raise ValueError('Empty or nonfinite waveform')
        response = {'id':request['id'],'samples':int(audio.size),'audio':base64.b64encode(audio.tobytes()).decode('ascii')}
    except Exception as error:
        response = {'id':request['id'],'error':str(error)}
    print(json.dumps(response,separators=(',',':')), flush=True)
