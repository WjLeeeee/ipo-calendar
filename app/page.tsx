"use client";
import { useEffect, useState } from "react";

interface IpoItem {
  name: string;
  period: string;
  fixedPrice: string;
  hopePrice: string;
  competition: string;
  underwriter: string;
  refundDate: string;
  listingDate: string;
}

function parseDates(period: string): { start: Date; end: Date } | null {
  const match = period.match(/(\d{4})\.(\d{2})\.(\d{2})~(\d{2})\.(\d{2})/);
  if (!match) return null;
  const [, year, sm, sd, em, ed] = match;
  return {
    start: new Date(Number(year), Number(sm) - 1, Number(sd)),
    end: new Date(Number(year), Number(em) - 1, Number(ed)),
  };
}

function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function IpoTable({ items }: { items: IpoItem[] }) {
  return (
    <>
      <div className="hidden md:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">종목명</th>
              <th className="p-3 text-center">청약일정</th>
              <th className="p-3 text-center">확정공모가</th>
              <th className="p-3 text-center">희망공모가</th>
              <th className="p-3 text-center">경쟁률</th>
              <th className="p-3 text-center">환불일</th>
              <th className="p-3 text-center">상장일</th>
              <th className="p-3 text-left">주간사</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white text-gray-900" : "bg-gray-50 text-gray-900"}>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3 text-center text-sm">{item.period}</td>
                <td className="p-3 text-center">{item.fixedPrice}</td>
                <td className="p-3 text-center">{item.hopePrice}</td>
                <td className="p-3 text-center">{item.competition || "-"}</td>
                <td className="p-3 text-center">{item.refundDate || "-"}</td>
                <td className="p-3 text-center">{item.listingDate || "-"}</td>
                <td className="p-3 text-sm text-gray-600">{item.underwriter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
            <div className="text-lg font-bold text-gray-900">{item.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>📅 청약: {item.period}</span>
              <span>💰 희망가: {item.hopePrice}</span>
              {item.fixedPrice && item.fixedPrice !== "-" && <span>✅ 확정가: {item.fixedPrice}</span>}
              {item.competition && <span>🏆 경쟁률: {item.competition}</span>}
              {item.refundDate && <span>💵 환불일: {item.refundDate}</span>}
              {item.listingDate && <span>📈 상장일: {item.listingDate}</span>}
              <span>🏦 주간사: {item.underwriter}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomCalendar({
  ipoList,
  onDateClick,
}: {
  ipoList: IpoItem[];
  onDateClick: (items: IpoItem[]) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const weekdays = ["월", "화", "수", "목", "금"];

  // 해당 월의 평일만 추출
  function getWeekdaysInMonth(y: number, m: number): (Date | null)[] {
    const days: (Date | null)[] = [];
    const firstDay = new Date(y, m, 1).getDay(); // 0=일, 1=월 ...
    // 첫째 주 월요일 맞추기
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) days.push(null);

    const lastDate = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) days.push(date);
      else {
        // 주말이면 빈칸 채우기 없이 스킵, 단 금->월 줄바꿈 처리
      }
    }
    return days;
  }

  // 주 단위로 나누기 (평일만, 5열)
  function getWeeks(y: number, m: number): (Date | null)[][] {
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];

    const firstDay = new Date(y, m, 1).getDay();
    const offset = firstDay === 0 ? 4 : firstDay - 2; // 월요일 기준 offset
    // 첫 주 빈칸
    for (let i = 0; i < Math.min(offset, 4); i++) week.push(null);

    const lastDate = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      if (dow === 6 || dow === 0) continue; // 주말 스킵
      week.push(date);
      if (dow === 5) { // 금요일이면 줄바꿈
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 5) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  function getBadges(date: Date) {
    const subs = ipoList.filter((item) => {
      const r = parseDates(item.period);
      return r && date >= r.start && date <= r.end;
    });
    const refunds = ipoList.filter((item) => {
      const rd = parseDate(item.refundDate);
      return rd && isSameDay(rd, date);
    });
    const listings = ipoList.filter((item) => {
      const ld = parseDate(item.listingDate);
      return ld && isSameDay(ld, date);
    });
    return { subs, refunds, listings };
  }

  function handleClick(date: Date | null) {
    if (!date) return;
    const { subs } = getBadges(date);
    onDateClick(subs);
    setTimeout(() => {
      document.getElementById("selected-list")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const weeks = getWeeks(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="w-full rounded-xl overflow-hidden shadow border border-gray-200">
      {/* 헤더 */}
      <div className="bg-blue-600 flex items-center justify-between px-4 py-3">
        <button onClick={prevMonth} className="text-white text-xl font-bold px-2">‹</button>
        <span className="text-white text-lg font-bold">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="text-white text-xl font-bold px-2">›</button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-5 bg-gray-100">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-sm font-bold text-gray-700 py-2">{d}</div>
        ))}
      </div>
      {/* 날짜 */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-5 border-t border-gray-100">
          {week.map((date, di) => {
            if (!date) return <div key={di} className="bg-gray-50 min-h-[80px]" />;
            const { subs, refunds, listings } = getBadges(date);
            const isToday = isSameDay(date, today);
            return (
              <div
                key={di}
                onClick={() => handleClick(date)}
                className={`min-h-[80px] p-1 border-l border-gray-100 cursor-pointer hover:bg-blue-50 flex flex-col ${isToday ? "bg-yellow-50" : "bg-white"}`}
              >
                <span className={`text-sm font-bold mb-1 ${isToday ? "text-blue-600" : "text-gray-800"}`}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {subs.map((item, i) => (
                    <span key={`s${i}`} className="text-xs bg-blue-500 text-white rounded px-1 leading-tight break-all">
                      {item.name}
                    </span>
                  ))}
                  {refunds.map((item, i) => (
                    <span key={`r${i}`} className="text-xs bg-orange-400 text-white rounded px-1 leading-tight break-all">
                      환불 {item.name}
                    </span>
                  ))}
                  {listings.map((item, i) => (
                    <span key={`l${i}`} className="text-xs bg-green-500 text-white rounded px-1 leading-tight break-all">
                      상장 {item.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [ipoList, setIpoList] = useState<IpoItem[]>([]);
  const [selected, setSelected] = useState<IpoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetch("/api/ipo")
      .then((res) => res.json())
      .then((data) => {
        setIpoList(data.filter((item: IpoItem) => item.name));
        setLoading(false);
      });
  }, []);

  function getMonthItems(month: Date) {
    return ipoList.filter((item) => {
      const range = parseDates(item.period);
      if (!range) return false;
      return (
        (range.start.getFullYear() === month.getFullYear() && range.start.getMonth() === month.getMonth()) ||
        (range.end.getFullYear() === month.getFullYear() && range.end.getMonth() === month.getMonth())
      );
    }).sort((a, b) => {
      const aRange = parseDates(a.period);
      const bRange = parseDates(b.period);
      if (!aRange || !bRange) return 0;
      return aRange.start.getTime() - bRange.start.getTime();
    });
  }

  const monthItems = getMonthItems(currentMonth);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-600 mb-4">
        공모주 청약 캘린더
      </h1>
      {loading ? (
        <p className="text-center text-gray-500">불러오는 중...</p>
      ) : (
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="flex bg-white rounded-xl shadow p-1 gap-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "calendar" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"}`}
            >
              📅 캘린더
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"}`}
            >
              📋 리스트
            </button>
          </div>

          {viewMode === "calendar" ? (
            <>
              <div className="flex gap-6 text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-500 inline-block"></span> 청약</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-orange-400 inline-block"></span> 환불</span>
                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500 inline-block"></span> 상장</span>
              </div>
              <div className="w-full">
                <CustomCalendar ipoList={ipoList} onDateClick={setSelected} />
              </div>
              {selected.length > 0 && (
                <div id="selected-list" className="w-full">
                  <IpoTable items={selected} />
                </div>
              )}
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentMonth(d);
                  }}
                  className="text-blue-600 font-bold text-xl px-3"
                >
                  ‹
                </button>
                <h2 className="text-lg font-bold text-gray-700">
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월 공모주 목록
                  <span className="ml-2 text-sm font-normal text-gray-400">({monthItems.length}건)</span>
                </h2>
                <button
                  onClick={() => {
                    const d = new Date(currentMonth);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentMonth(d);
                  }}
                  className="text-blue-600 font-bold text-xl px-3"
                >
                  ›
                </button>
              </div>
              {monthItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">해당 월에 공모주가 없습니다.</p>
              ) : (
                <IpoTable items={monthItems} />
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}