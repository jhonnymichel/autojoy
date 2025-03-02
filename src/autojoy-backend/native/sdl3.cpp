#include <napi.h>
#include <windows.h>
#include <iostream>
#include <string>
#include <iomanip>
#include <sstream>

// Define Uint8 since we're not using SDL headers
typedef unsigned char Uint8;

// SDL_GUID structure with correct C++ syntax
struct SDL_GUID {
    Uint8 data[16];
};

// Function types
typedef bool (*SDL_Init_Func)(uint32_t);
typedef const char* (*SDL_GetError_Func)();
typedef void (*SDL_ClearError_Func)();
typedef void (*SDL_Quit_Func)();
typedef int* (*SDL_GetJoysticks_Func)(int*);
typedef void* (*SDL_OpenJoystick_Func)(int);
typedef const char* (*SDL_GetJoystickName_Func)(void*);
typedef uint16_t (*SDL_GetJoystickVendor_Func)(void*);
typedef uint16_t (*SDL_GetJoystickProduct_Func)(void*);
typedef int (*SDL_GetJoystickType_Func)(void*);
typedef SDL_GUID (*SDL_GetJoystickGUID_Func)(void*);
typedef void (*SDL_GUIDToString_Func)(SDL_GUID, char*, int);
typedef void (*SDL_CloseJoystick_Func)(void*);

// Helper function to convert SDL_JoystickType to string
const char* JoystickTypeToString(int type) {
    switch (type) {
        case 1: return "gamecontroller";  // SDL_JOYSTICK_TYPE_GAMEPAD
        case 6: return "guitar";
        // Add other types as needed
        default: return "unknown";
    }
}

// Helper function to format GUID
std::string FormatGUID(SDL_GUID guid) {
    std::stringstream ss;
    for (int i = 0; i < 16; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(guid.data[i]);
    }
    return ss.str();
}

Napi::Array GetJoysticks(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array devices = Napi::Array::New(env);

    // Get the current module's path
    char modulePath[MAX_PATH];
    HMODULE hModule = NULL;
    GetModuleHandleEx(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                      GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                      (LPCSTR)&GetJoysticks, &hModule);
    GetModuleFileNameA(hModule, modulePath, sizeof(modulePath));

    std::string path = modulePath;
    size_t lastBackslash = path.find_last_of("\\");
    if (lastBackslash != std::string::npos) {
        path = path.substr(0, lastBackslash + 1);
    }

    std::string sdlPath = path + "SDL3.dll";

    HMODULE sdl = LoadLibraryA(sdlPath.c_str());
    if (!sdl) {
        std::cout << "Failed to load SDL3.dll: " << GetLastError() << std::endl;
        return devices;
    }

    // Get all the SDL functions we need
    SDL_Init_Func SDL_Init = (SDL_Init_Func)GetProcAddress(sdl, "SDL_Init");
    SDL_GetError_Func SDL_GetError = (SDL_GetError_Func)GetProcAddress(sdl, "SDL_GetError");
    SDL_ClearError_Func SDL_ClearError = (SDL_ClearError_Func)GetProcAddress(sdl, "SDL_ClearError");
    SDL_Quit_Func SDL_Quit = (SDL_Quit_Func)GetProcAddress(sdl, "SDL_Quit");
    
    // Add new function pointers
    SDL_GetJoysticks_Func SDL_GetJoysticks = (SDL_GetJoysticks_Func)GetProcAddress(sdl, "SDL_GetJoysticks");
    SDL_OpenJoystick_Func SDL_OpenJoystick = (SDL_OpenJoystick_Func)GetProcAddress(sdl, "SDL_OpenJoystick");
    SDL_GetJoystickName_Func SDL_GetJoystickName = (SDL_GetJoystickName_Func)GetProcAddress(sdl, "SDL_GetJoystickName");
    SDL_GetJoystickVendor_Func SDL_GetJoystickVendor = (SDL_GetJoystickVendor_Func)GetProcAddress(sdl, "SDL_GetJoystickVendor");
    SDL_GetJoystickProduct_Func SDL_GetJoystickProduct = (SDL_GetJoystickProduct_Func)GetProcAddress(sdl, "SDL_GetJoystickProduct");
    SDL_GetJoystickType_Func SDL_GetJoystickType = (SDL_GetJoystickType_Func)GetProcAddress(sdl, "SDL_GetJoystickType");
    SDL_GetJoystickGUID_Func SDL_GetJoystickGUID = (SDL_GetJoystickGUID_Func)GetProcAddress(sdl, "SDL_GetJoystickGUID");
    SDL_GUIDToString_Func SDL_GUIDToString = (SDL_GUIDToString_Func)GetProcAddress(sdl, "SDL_GUIDToString");
    SDL_CloseJoystick_Func SDL_CloseJoystick = (SDL_CloseJoystick_Func)GetProcAddress(sdl, "SDL_CloseJoystick");

    // Initialize SDL with joystick subsystem
    if (!SDL_Init(0x00000200)) {  // SDL_INIT_JOYSTICK
        const char* error = SDL_GetError();
        std::cout << "Joystick init failed: " << (error ? error : "No error message") << std::endl;
        FreeLibrary(sdl);
        return devices;
    }

    // Get number of joysticks
    int numJoysticks = 0;
    int* joystickIds = SDL_GetJoysticks(&numJoysticks);
    
    if (!joystickIds || numJoysticks == 0) {
        SDL_Quit();
        FreeLibrary(sdl);
        return devices;
    }

    // Enumerate joysticks
    for (int i = 0; i < numJoysticks; i++) {
        void* joystick = SDL_OpenJoystick(joystickIds[i]);
        if (!joystick) continue;

        Napi::Object device = Napi::Object::New(env);
        
        // Set all the properties to match the required format
        device.Set("_index", Napi::Number::New(env, i));
        device.Set("id", Napi::Number::New(env, joystickIds[i]));
        device.Set("type", Napi::String::New(env, JoystickTypeToString(SDL_GetJoystickType(joystick))));
        device.Set("name", Napi::String::New(env, SDL_GetJoystickName(joystick)));
        
        // Get and format GUID
        SDL_GUID guid = SDL_GetJoystickGUID(joystick);
        char guidStr[33] = {0};  // Ensure null termination
        SDL_GUIDToString(guid, guidStr, sizeof(guidStr));
        device.Set("guid", Napi::String::New(env, guidStr));
        
        device.Set("vendor", Napi::Number::New(env, SDL_GetJoystickVendor(joystick)));
        device.Set("product", Napi::Number::New(env, SDL_GetJoystickProduct(joystick)));
        device.Set("version", env.Null());
        device.Set("player", Napi::Number::New(env, 0));
        
        // For the path, we'll need to implement Windows-specific code to get the device path
        // This is a placeholder for now - we can implement the actual path retrieval if needed
        device.Set("path", Napi::String::New(env, ""));

        devices[i] = device;
        SDL_CloseJoystick(joystick);
    }

    SDL_Quit();
    FreeLibrary(sdl);
    return devices;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getJoysticks", Napi::Function::New(env, GetJoysticks));
    return exports;
}

NODE_API_MODULE(sdl3, Init)