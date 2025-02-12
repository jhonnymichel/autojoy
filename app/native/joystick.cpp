#include <napi.h>
#include <Windows.h>
#include <mmsystem.h>
#include <string>

Napi::Array GetJoysticks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array devices = Napi::Array::New(env);

    // Get number of joystick devices
    UINT numDevs = joyGetNumDevs();
    if (numDevs <= 0) {
        return devices;
    }

    uint32_t deviceIndex = 0;

    // Enumerate all possible joystick indices
    for (UINT i = 0; i < numDevs; i++) {
        JOYINFOEX joyInfo;
        JOYCAPS joyCaps;
        joyInfo.dwSize = sizeof(joyInfo);
        joyInfo.dwFlags = JOY_RETURNALL;

        // Check if the joystick is connected
        if (joyGetDevCaps(i, &joyCaps, sizeof(joyCaps)) == JOYERR_NOERROR) {
            if (joyGetPosEx(i, &joyInfo) == JOYERR_NOERROR) {
                Napi::Object device = Napi::Object::New(env);
                    
                // Basic info
                device.Set("id", Napi::Number::New(env, i));
                device.Set("name", Napi::String::New(env, joyCaps.szPname));
                device.Set("numButtons", Napi::Number::New(env, joyCaps.wNumButtons));
                device.Set("numAxes", Napi::Number::New(env, joyCaps.wNumAxes));

                // Capabilities
                device.Set("manufacturerId", Napi::Number::New(env, joyCaps.wMid));
                device.Set("productId", Napi::Number::New(env, joyCaps.wPid));

                devices[deviceIndex++] = device;
            }
        }
    }

    return devices;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getJoysticks", Napi::Function::New(env, GetJoysticks));
    return exports;
}

NODE_API_MODULE(joystick, Init)