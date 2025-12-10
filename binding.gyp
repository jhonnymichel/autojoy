{
  "targets": [
    {
      "target_name": "joystick",
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "conditions": [
        [
          "OS=='win'",
          {
            "sources": [
              "src/autojoy-backend/native/joystick.cpp"
            ],
            "libraries": [
              "winmm.lib"
            ]
          },
          {
            "sources": [
              "src/autojoy-backend/native/stub.cpp"
            ]
          }
        ]
      ]
    }
  ]
}