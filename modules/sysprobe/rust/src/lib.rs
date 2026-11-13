//! The implementation of package sysprobe in Rust: `sysinfo` for the
//! machine, WMI for the Plug and Play devices Windows knows.

mod mygo;

use mygo::*;
use std::sync::Arc;

pub fn make_probe() -> Result<Arc<dyn Probe>, Error> {
    Ok(Arc::new(NativeProbe))
}

struct NativeProbe;

fn text(value: impl ToString) -> String {
    value.to_string()
}

impl Probe for NativeProbe {
    fn snapshot(&self, ctx: &Context) -> Result<Snapshot, Error> {
        ctx.check()?;

        // CPU usage is a difference: take one sample, wait, take another.
        let mut sys = sysinfo::System::new_all()
            .map_err(|e| Error::other(format!("read system: {e}")))?;
        ctx.sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL)?;
        sys.refresh_cpu_usage();
        sys.refresh_memory();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
        ctx.check()?;

        let mut processes: Vec<Process> = sys
            .processes()
            .values()
            .map(|process| Process {
                pid: process.pid().as_u32(),
                name: process.name().to_string_lossy().into_owned(),
                memory: process.memory(),
                cpu: process.cpu_usage() as f64,
            })
            .collect();
        processes.sort_by(|a, b| b.memory.cmp(&a.memory));
        processes.truncate(8);

        let disks = sysinfo::Disks::new_with_refreshed_list()
            .map_err(|e| Error::other(format!("read disks: {e}")))?;
        let volumes: Vec<Disk> = (&disks)
            .into_iter()
            .map(|disk| Disk {
                name: disk.name().to_string_lossy().into_owned(),
                mount_point: disk.mount_point().to_string_lossy().into_owned(),
                file_system: disk.file_system().to_string_lossy().into_owned(),
                total: disk.total_space(),
                available: disk.available_space(),
                removable: disk.is_removable(),
            })
            .collect();

        Ok(Snapshot {
            hostname: sysinfo::System::host_name().unwrap_or_default(),
            os_name: sysinfo::System::name().unwrap_or_default(),
            os_version: sysinfo::System::os_version().unwrap_or_default(),
            kernel_version: sysinfo::System::kernel_version().unwrap_or_default(),
            cpu_name: sys
                .cpus()
                .first()
                .map(|cpu| text(cpu.brand()).trim().to_string())
                .unwrap_or_default(),
            cpu_cores: sys.cpus().len() as i64,
            cpu_usage: sys.global_cpu_usage() as f64,
            memory_total: sys.total_memory(),
            memory_used: sys.used_memory(),
            swap_total: sys.total_swap(),
            swap_used: sys.used_swap(),
            uptime_seconds: sysinfo::System::uptime().unwrap_or_default() as i64,
            process_count: sys.processes().len() as i64,
            disks: volumes,
            processes,
            // Go fills the battery in, where the platform reports it.
            battery_percent: -1,
            battery_charging: false,
        })
    }

    fn devices(&self, ctx: &Context) -> Result<Vec<Device>, Error> {
        ctx.check()?;
        let devices = platform_devices()?;
        ctx.check()?;
        Ok(devices)
    }
}

#[cfg(windows)]
fn platform_devices() -> Result<Vec<Device>, Error> {
    use serde::Deserialize;
    use wmi::{COMLibrary, WMIConnection};

    #[derive(Deserialize)]
    #[serde(rename_all = "PascalCase")]
    struct PnpEntity {
        name: Option<String>,
        pnp_class: Option<String>,
        manufacturer: Option<String>,
        device_id: Option<String>,
        status: Option<String>,
        config_manager_error_code: Option<u32>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "PascalCase")]
    struct SignedDriver {
        device_id: Option<String>,
        driver_version: Option<String>,
    }

    let com = COMLibrary::new().map_err(|e| Error::other(format!("init COM: {e}")))?;
    let connection = WMIConnection::with_namespace_path("ROOT\\CIMV2", com.into())
        .map_err(|e| Error::other(format!("connect WMI: {e}")))?;
    let rows: Vec<PnpEntity> = connection
        .raw_query(
            "SELECT Name, PNPClass, Manufacturer, DeviceID, Status, \
             ConfigManagerErrorCode FROM Win32_PnPEntity",
        )
        .map_err(|e| Error::other(format!("query Win32_PnPEntity: {e}")))?;

    // DriverVersion lives on Win32_PnPSignedDriver, keyed by the same
    // device instance ID. A failure here leaves the versions empty.
    let drivers: std::collections::HashMap<String, String> = connection
        .raw_query::<SignedDriver>("SELECT DeviceID, DriverVersion FROM Win32_PnPSignedDriver")
        .unwrap_or_default()
        .into_iter()
        .filter_map(|row| Some((row.device_id?, row.driver_version.unwrap_or_default())))
        .collect();

    let mut devices: Vec<Device> = rows
        .into_iter()
        .filter_map(|row| {
            let id = row.device_id?;
            if id.is_empty() {
                return None;
            }
            Some(Device {
                driver_version: drivers.get(&id).cloned().unwrap_or_default(),
                id,
                name: row.name.unwrap_or_else(|| "Unknown device".into()),
                class: row.pnp_class.unwrap_or_default(),
                manufacturer: row.manufacturer.unwrap_or_default(),
                status: row.status.unwrap_or_default(),
                error_code: row.config_manager_error_code.unwrap_or(0) as i32,
            })
        })
        .collect();
    devices.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(devices)
}

#[cfg(not(windows))]
fn platform_devices() -> Result<Vec<Device>, Error> {
    Err(Error::Unsupported)
}
