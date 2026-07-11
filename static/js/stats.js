let focusChartInstance = null;

async function fetchStatsAndDraw() {
    try {
        const response = await fetch("/api/stats");
        if (!response.ok) throw new Error("Could not load focus statistics.");
        const data = await response.json();
        
        // Sum total stats
        let totalMinutes = 0;
        let totalSessions = 0;
        
        data.forEach(day => {
            totalMinutes += day.minutes;
            if (day.minutes > 0) {
                // Approximate 25-minute pomodoro sessions
                totalSessions += Math.round(day.minutes / 25) || 1;
            }
        });
        
        document.getElementById("total-sessions-val").textContent = totalSessions;
        document.getElementById("total-hours-val").textContent = `${totalMinutes} mins`;

        drawStatsChart(data);
    } catch (error) {
        console.error("Failed to query stats:", error);
    }
}

function drawStatsChart(data) {
    const ctx = document.getElementById('focusChart').getContext('2d');
    
    // Labels (format date strings to "Mon", "Tue", etc.)
    const labels = data.map(d => {
        const dateObj = new Date(d.date);
        return dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    });
    
    const minutes = data.map(d => d.minutes);

    // Gradient fill for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#8b5cf6'); // Violet
    gradient.addColorStop(1, '#3b82f6'); // Blue

    if (focusChartInstance) {
        focusChartInstance.destroy();
    }

    focusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Focus Minutes',
                data: minutes,
                backgroundColor: gradient,
                borderRadius: 8,
                borderWidth: 0,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleFont: { family: 'Outfit', size: 13 },
                    bodyFont: { family: 'Outfit', size: 12 },
                    padding: 12,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} mins focused`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { family: 'Outfit', size: 11 },
                        callback: function(value) {
                            return value + 'm';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });
}
