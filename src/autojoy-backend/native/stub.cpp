#include <napi.h>

Napi::Array GetJoysticks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Array::New(env); // empty array on non-Windows
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getJoysticks", Napi::Function::New(env, GetJoysticks));
    return exports;
}

NODE_API_MODULE(joystick, Init)
