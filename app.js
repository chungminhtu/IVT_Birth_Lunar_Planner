// Calendar state
let currentYear = 2027;
let currentMonth = 1;
let selectedDate = null;
let solarMainMode = false; // false = lunar main, true = solar main

// DOM elements
const resultDiv = document.getElementById('result');
const calendarDays = document.getElementById('calendarDays');
const calendarTitle = document.getElementById('calendarTitle');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const solarMainCheckbox = document.getElementById('solarMainMode');

// Initialize holidays for Vietnam using date-holidays library
let holidaysHD;
if (typeof window !== 'undefined' && window.Holidays) {
  // UMD build exports as window.Holidays.default
  const HolidaysClass = window.Holidays.default || window.Holidays;
  holidaysHD = new HolidaysClass('VN');
} else {
  holidaysHD = null;
  console.warn('date-holidays library not loaded');
}

// Helper: Get start of week (Monday)
function startOfWeekMonday(date) {
  const day = date.day();
  const diff = date.date() - day + (day === 0 ? -6 : 1);
  return date.date(diff).startOf('day');
}

// Helper: Get end of week (Sunday)
function endOfWeekSunday(date) {
  return startOfWeekMonday(date).add(6, 'day');
}

// Helper: Get Vietnamese holiday from solar date using date-holidays library
function getVietnameseHoliday(solarDate) {
  if (!holidaysHD) {
    return null;
  }
  
  try {
    const jsDate = new Date(solarDate.getYear(), solarDate.getMonth() - 1, solarDate.getDay());
    const holiday = holidaysHD.isHoliday(jsDate);
    if (holiday && holiday.length > 0) {
      return holiday[0].name;
    }
  } catch (e) {
    console.warn('Holiday check error:', e);
  }
  
  return null;
}

// Helper: Find last day of lunar month
function getLastLunarDay(year, month) {
  let lastDay = Lunar.fromYmd(year, month, 1);
  let dayCount = 1;
  while (true) {
    try {
      lastDay = Lunar.fromYmd(year, month, dayCount + 1);
      dayCount++;
    } catch (e) {
      break;
    }
  }
  return lastDay;
}

// Helper: Format date pair (solar + lunar)
function formatDatePair(solarJsDate) {
  const daysOfWeek = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayOfWeek = daysOfWeek[solarJsDate.getDay()];
  const day = solarJsDate.getDate();
  const month = solarJsDate.getMonth() + 1;
  const year = solarJsDate.getFullYear();
  const solarStr = `${dayOfWeek}, ngày ${day} tháng ${month}, năm ${year}`;
  
  const solarDate = Solar.fromYmd(year, month, day);
  const lunarDate = solarDate.getLunar();
  const lunarStr = `${dayOfWeek}, ngày ${lunarDate.getDay()} tháng ${lunarDate.getMonth()}, năm ${lunarDate.getYear()} (Âm lịch)`;
  
  return `<strong style="color: #2d3748;">${solarStr}</strong><br><small style="color: #666; font-weight: normal;">${lunarStr}</small>`;
}

// Render calendar
function renderCalendar() {
  calendarDays.innerHTML = '';
  
  try {
    if (!window.dayjs) {
      throw new Error('Calendar library (dayjs) not loaded');
    }

    const dayjs = window.dayjs;
    let startSolarJsDate, endSolarJsDate;
    
    if (solarMainMode) {
      // Solar main mode: show solar month
      const solarYear = currentYear;
      const solarMonth = currentMonth - 1; // JavaScript months are 0-indexed
      const firstDay = new Date(solarYear, solarMonth, 1);
      const lastDay = new Date(solarYear, solarMonth + 1, 0);
      startSolarJsDate = firstDay;
      endSolarJsDate = lastDay;
      calendarTitle.textContent = `Tháng ${currentMonth}, Năm ${currentYear} (Dương lịch)`;
    } else {
      // Lunar main mode: show lunar month
      const firstLunarDay = Lunar.fromYmd(currentYear, currentMonth, 1);
      const firstSolarDate = firstLunarDay.getSolar();
      const lastLunarDay = getLastLunarDay(currentYear, currentMonth);
      const lastSolarDate = lastLunarDay.getSolar();
      startSolarJsDate = new Date(firstSolarDate.getYear(), firstSolarDate.getMonth() - 1, firstSolarDate.getDay());
      endSolarJsDate = new Date(lastSolarDate.getYear(), lastSolarDate.getMonth() - 1, lastSolarDate.getDay());
      calendarTitle.textContent = `Tháng ${currentMonth}, Năm ${currentYear} (Âm lịch)`;
    }

    const startSolarDate = dayjs(startSolarJsDate);
    const endSolarDate = dayjs(endSolarJsDate);
    const calendarStart = startOfWeekMonday(startSolarDate);
    const calendarEnd = endOfWeekSunday(endSolarDate);

    // Generate calendar weeks
    const calendarWeeks = [];
    let currentWeekStart = calendarStart;

    while (currentWeekStart.isBefore(calendarEnd) || currentWeekStart.isSame(calendarEnd, 'day')) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = currentWeekStart.add(i, 'day');
        week.push({
          year: date.year(),
          month: date.month(),
          day: date.date()
        });
      }
      calendarWeeks.push(week);
      currentWeekStart = currentWeekStart.add(7, 'day');
    }

    // Render calendar days
    calendarWeeks.forEach(week => {
      week.forEach(dayData => {
        const solarJsDate = new Date(dayData.year, dayData.month, dayData.day);
        const solarDate = Solar.fromYmd(dayData.year, dayData.month + 1, dayData.day);
        const lunarDate = solarDate.getLunar();
        const holiday = getVietnameseHoliday(solarDate);
        
        // Determine if this day is in current month based on mode
        let isCurrentMonth;
        if (solarMainMode) {
          isCurrentMonth = dayData.month === currentMonth - 1 && dayData.year === currentYear;
        } else {
          isCurrentMonth = lunarDate.getMonth() === currentMonth && lunarDate.getYear() === currentYear;
        }

        const dayElement = document.createElement('div');
        const weekday = solarJsDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Set base class
        dayElement.className = 'calendar-day';
        
        // Add weekend classes for all days
        if (weekday === 6) {
          dayElement.classList.add('weekend-saturday');
        } else if (weekday === 0) {
          dayElement.classList.add('weekend-sunday');
        }
        
        if (!isCurrentMonth) {
          dayElement.classList.add('other-month');
        } else {
          if (solarMainMode) {
            dayElement.dataset.year = currentYear;
            dayElement.dataset.month = currentMonth;
            dayElement.dataset.day = solarJsDate.getDate();
          } else {
            dayElement.dataset.year = currentYear;
            dayElement.dataset.month = currentMonth;
            dayElement.dataset.day = lunarDate.getDay();
          }

          // Check if selected (works for both modes)
          if (selectedDate) {
            let isSelected = false;
            if (solarMainMode) {
              isSelected = selectedDate.year === currentYear &&
                          selectedDate.month === currentMonth &&
                          selectedDate.day === solarJsDate.getDate();
            } else {
              isSelected = selectedDate.year === currentYear &&
                          selectedDate.month === currentMonth &&
                          selectedDate.day === lunarDate.getDay();
            }
            if (isSelected) {
              dayElement.classList.add('selected');
            }
          }

          if (holiday) {
            dayElement.classList.add('holiday');
          }

          const today = new Date();
          if (solarJsDate.getFullYear() === today.getFullYear() &&
              solarJsDate.getMonth() === today.getMonth() &&
              solarJsDate.getDate() === today.getDate()) {
            dayElement.classList.add('today');
          }
        }

        // Display format based on mode
        let mainNumber, secondaryNumber;
        if (solarMainMode) {
          mainNumber = solarJsDate.getDate();
          secondaryNumber = `${lunarDate.getDay()}/${lunarDate.getMonth()} (Âm)`;
        } else {
          mainNumber = lunarDate.getDay();
          secondaryNumber = `${solarJsDate.getDate()}/${solarJsDate.getMonth() + 1} (Dương)`;
        }
        
        dayElement.innerHTML = `
          <div class="day-info">
            <div class="day-number">${mainNumber}</div>
            <div class="lunar-number">${secondaryNumber}</div>
          </div>
          ${holiday && isCurrentMonth ? `<div class="holiday-name">${holiday}</div>` : ''}
        `;

        if (isCurrentMonth) {
          dayElement.addEventListener('click', () => {
            if (solarMainMode) {
              selectedDate = { year: currentYear, month: currentMonth, day: solarJsDate.getDate(), isSolar: true };
            } else {
              selectedDate = { year: currentYear, month: currentMonth, day: lunarDate.getDay(), isSolar: false };
            }
            renderCalendar();
            calculateIVFSchedule();
          });
        }

        calendarDays.appendChild(dayElement);
      });
    });
  } catch (e) {
    console.error('Calendar error:', e);
    calendarDays.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">Lỗi khi tải thư viện lịch. Vui lòng tải lại trang.</div>';
  }
}

// Navigation
prevMonthBtn.addEventListener('click', () => {
  if (currentMonth === 1) {
    currentMonth = 12;
    currentYear--;
  } else {
    currentMonth--;
  }
  selectedDate = null; // Clear selection when changing month
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  if (currentMonth === 12) {
    currentMonth = 1;
    currentYear++;
  } else {
    currentMonth++;
  }
  selectedDate = null; // Clear selection when changing month
  renderCalendar();
});

// Calculate IVF schedule
function calculateIVFSchedule() {
  if (!selectedDate) {
    resultDiv.innerHTML = '<div class="muted">Vui lòng chọn ngày Âm lịch để xem lịch IVF.</div>';
    return;
  }

  try {
    let solarJsDate;
    if (selectedDate.isSolar) {
      // Selected date is solar
      solarJsDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
    } else {
      // Selected date is lunar
      const lunarDate = Lunar.fromYmd(selectedDate.year, selectedDate.month, selectedDate.day);
      const solarDateObj = lunarDate.getSolar();
      solarJsDate = new Date(solarDateObj.getYear(), solarDateObj.getMonth() - 1, solarDateObj.getDay());
    }

    const DAY = 24 * 60 * 60 * 1000;
    const gestationDays = 261;
    const transferDate = new Date(solarJsDate.getTime() - gestationDays * DAY);
    const retrievalDate = new Date(transferDate.getTime() - 5 * DAY);
    const stimStartDate = new Date(retrievalDate.getTime() - 12 * DAY);

    resultDiv.innerHTML = `
      <div><strong>🎯 Ngày sinh dự kiến</strong><br>
      <strong>${formatDatePair(solarJsDate)}</strong></div>
      <div style="height:12px;"></div>
      <div><strong>🧮 Lịch IVF ước tính</strong></div>
      <div>• Bắt đầu kích trứng: <strong>${formatDatePair(stimStartDate)}</strong></div>
      <div>• Chọc hút trứng: <strong>${formatDatePair(retrievalDate)}</strong></div>
      <div>• Chuyển phôi: <strong>${formatDatePair(transferDate)}</strong></div>
      <div style="margin-top:8px;" class="muted">* Ước tính dựa trên chuyển phôi 5 ngày (thai kỳ 261 ngày) và thời gian trung bình của quy trình IVF.</div>
    `;
  } catch (e) {
    let errorMessage = 'Có lỗi khi tính toán ngày. ';
    if (e.message.includes('wrong')) {
      errorMessage += 'Ngày âm lịch không hợp lệ. Vui lòng chọn ngày khác.';
    } else {
      errorMessage += 'Vui lòng thử lại hoặc chọn ngày khác.';
    }
    alert(errorMessage);
    console.error('Date calculation error:', e);
  }
}

// Toggle solar/lunar main mode
solarMainCheckbox.addEventListener('change', (e) => {
  solarMainMode = e.target.checked;
  selectedDate = null; // Clear selection when switching modes
  resultDiv.innerHTML = '<div class="muted">Vui lòng chọn ngày Âm lịch để xem lịch IVF.</div>';
  renderCalendar();
});

// Initialize
renderCalendar();

