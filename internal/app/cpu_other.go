//go:build !windows

package app

// cpuSampler is not implemented off Windows; the native module reports it.
type cpuSampler struct{}

func (s *cpuSampler) usage() float64 { return -1 }
