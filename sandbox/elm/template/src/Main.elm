port module Main exposing (main)


port print : String -> Cmd msg


main : Program () () Never
main =
    Platform.worker
        { init = \_ -> ( (), print output )
        , update = \_ model -> ( model, Cmd.none )
        , subscriptions = \_ -> Sub.none
        }


output : String
output =
    "Hello, World!"
