// Export routines and history records to CSV
export const exportRoutinesToCSV = (routines = [], analytics = {}) => {
  const rows = [
    ["Routine Title", "Category", "Frequency", "Task Title", "Total Completed Days", "Created At"],
  ];

  routines.forEach((routine) => {
    const category = routine.category || "lifestyle";
    const freq = routine.frequency || "daily";
    const createdAt = routine.createdAt ? new Date(routine.createdAt).toLocaleDateString() : "";

    if (routine.tasks && routine.tasks.length > 0) {
      routine.tasks.forEach((task) => {
        const completedDaysCount = (task.completedDates || []).length;
        rows.push([
          `"${routine.title.replace(/"/g, '""')}"`,
          `"${category}"`,
          `"${freq}"`,
          `"${task.title.replace(/"/g, '""')}"`,
          completedDaysCount,
          `"${createdAt}"`,
        ]);
      });
    } else {
      rows.push([
        `"${routine.title.replace(/"/g, '""')}"`,
        `"${category}"`,
        `"${freq}"`,
        "N/A",
        0,
        `"${createdAt}"`,
      ]);
    }
  });

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `routineos_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export full backup to JSON
export const exportRoutinesToJSON = (routines = [], analytics = {}, achievements = []) => {
  const exportObject = {
    appName: "RoutineOS",
    exportDate: new Date().toISOString(),
    version: "2.0",
    analyticsSummary: analytics,
    routinesCount: routines.length,
    routines,
    achievements,
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
  const link = document.createElement("a");
  link.setAttribute("href", dataStr);
  link.setAttribute("download", `routineos_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
