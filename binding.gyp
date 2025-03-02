{
  "targets": [
    {
      "target_name": "joystick",
      "sources": [ "src/autojoy-backend/native/joystick.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [ "winmm.lib" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    },
    {
      "target_name": "sdl3",
      "sources": [ "src/autojoy-backend/native/sdl3.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src/autojoy-backend/native"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}