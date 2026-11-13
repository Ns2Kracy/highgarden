package main

import (
	"log"
	"time"

	"github.com/egoist/mygo"
	"github.com/egoist/mygo/plugins/fetch"
	"github.com/egoist/mygo/plugins/sqlite"
	"github.com/egoist/mygo/plugins/updater/native"
	"github.com/egoist/mygo/plugins/watch"
	"github.com/egoist/mygo/plugins/websocket"

	"highgarden/internal/app"
)

// Tick is sent to the page every second, for the status bar clock.
var Tick = mygo.NewEvent[time.Time]("tick")

func main() {
	mygo.Use(fetch.Plugin)
	mygo.Use(websocket.Plugin)
	mygo.Use(sqlite.Plugin)
	mygo.Use(native.Plugin)
	mygo.Use(watch.New(watch.Options{}))

	digest := app.NewDigest()
	mygo.Bind(app.NewPreferences())
	mygo.Bind(digest)
	mygo.Bind(app.NewSystem(digest.Engine()))
	mygo.Bind(app.Files{})
	mygo.Bind(app.Apps{})
	mygo.Bind(app.Cleaner{})
	mygo.Bind(app.Startup{})

	mygo.App.WhenReady(func() {
		win := mygo.NewWindow(mygo.WindowOptions{
			Title:     "Highgarden",
			Width:     1120,
			Height:    720,
			MinWidth:  720,
			MinHeight: 480,
			// The page draws the title bar, under the controls the system
			// keeps. See src/components/shell/titlebar.tsx.
			TitleBarStyle:   mygo.TitleBarHidden,
			TitleBarHeight:  40,
			BackgroundColor: "light-dark(#f4f5f7, #0b0d12)", // --bg in src/style.css
			StateKey:        "main",
			URL:             "/",
		})
		go func() {
			for t := range time.Tick(time.Second) {
				if Tick.Emit(win, t) != nil {
					return // the window was closed
				}
			}
		}()
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
