//go:build windows

package app

import (
	"sync"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

var procGetSystemTimes = windows.NewLazySystemDLL("kernel32.dll").NewProc("GetSystemTimes")

type fileTime struct {
	Low  uint32
	High uint32
}

func (t fileTime) uint64() uint64 { return uint64(t.High)<<32 | uint64(t.Low) }

// systemTimes returns the idle and total CPU time in 100 ns units.
func systemTimes() (idle, total uint64, err error) {
	var i, k, u fileTime
	ok, _, errno := procGetSystemTimes.Call(
		uintptr(unsafe.Pointer(&i)),
		uintptr(unsafe.Pointer(&k)),
		uintptr(unsafe.Pointer(&u)),
	)
	if ok == 0 {
		return 0, 0, errno
	}
	return i.uint64(), k.uint64() + u.uint64(), nil
}

// cpuSampler measures the CPU between two overview calls.
type cpuSampler struct {
	mu        sync.Mutex
	lastAt    time.Time
	lastTotal uint64
	lastBusy  uint64
	lastUsage float64
}

func (s *cpuSampler) usage() float64 {
	idle, total, err := systemTimes()
	if err != nil || total == 0 {
		return 0
	}
	busy := total - idle
	now := time.Now()

	s.mu.Lock()
	defer s.mu.Unlock()
	previousAt, previousTotal, previousBusy := s.lastAt, s.lastTotal, s.lastBusy
	s.lastAt, s.lastTotal, s.lastBusy = now, total, busy
	if previousTotal == 0 || now.Sub(previousAt) < 50*time.Millisecond {
		return s.lastUsage
	}
	deltaTotal := total - previousTotal
	deltaBusy := busy - previousBusy
	if deltaTotal == 0 {
		return s.lastUsage
	}
	s.lastUsage = float64(deltaBusy) / float64(deltaTotal) * 100
	return s.lastUsage
}
