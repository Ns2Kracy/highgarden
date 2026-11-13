package app

import (
	"context"
	"testing"
)

func TestOverview(t *testing.T) {
	system := NewSystem("rust")
	snapshot, err := system.Overview(context.Background())
	if err != nil {
		t.Skipf("native sysprobe module not available: %v", err)
	}
	if snapshot.Hostname == "" {
		t.Error("hostname is empty")
	}
	if snapshot.CPUCores <= 0 {
		t.Errorf("CPUCores = %d", snapshot.CPUCores)
	}
	if snapshot.MemoryTotal == 0 {
		t.Error("MemoryTotal = 0")
	}
	if len(snapshot.Disks) == 0 {
		t.Error("no disks")
	}
	if snapshot.BatteryPercent < -1 || snapshot.BatteryPercent > 100 {
		t.Errorf("BatteryPercent = %d", snapshot.BatteryPercent)
	}
}
