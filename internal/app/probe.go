package app

import (
	"sync"

	"highgarden/modules/sysprobe"
)

// probeClient loads the native sysprobe module once, and retries if it was
// not available yet.
type probeClient struct {
	mu    sync.Mutex
	probe sysprobe.Probe
}

func (c *probeClient) get() (sysprobe.Probe, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.probe != nil {
		return c.probe, nil
	}
	probe, err := sysprobe.NewProbe()
	if err != nil {
		return nil, err
	}
	c.probe = probe
	return probe, nil
}
