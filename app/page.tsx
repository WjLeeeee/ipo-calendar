"use client";
import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
  const start = new Date(Number(year), Number(sm) - 1, Number(sd));
  const end = new Date(Number(year), Number(em) - 1, Number(ed));
  return { start, end };
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
      {/* PC 테이블 */}
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

      {/* 모바일 카드 */}
      <div className="md:hidden flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
            <div className="text-lg font-bold text-gray-900">{item.name}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span>📅 청약: {item.period}</span>
              <span>💰 희망가: {item.hopePrice}</span>
              {item.fixedPrice && item.fixedPrice !== "-" && (
                <span>✅ 확정가: {item.fixedPrice}</span>
              )}
              {item.competition && (
                <span>🏆 경쟁률: {item.competition}</span>
              )}
              {item.refundDate && (
                <span>💵 환불일: {item.refundDate}</span>
              )}
              {item.listingDate && (
                <span>📈 상장일: {item.listingDate}</span>
              )}
              <span>🏦 주간사: {item.underwriter}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Home() {
  const [ipoList, setIpoList] = useState<IpoItem[]>([]);
  const [selected, setSelected] = useState<IpoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
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

  function getTileContent({ date: d }: { date: Date }) {
    const subscriptions = ipoList.filter((item) => {
      const range = parseDates(item.period);
      if (!range) return false;
      return d >= range.start && d <= range.end;
    });
    const refunds = ipoList.filter((item) => {
      const rd = parseDate(item.refundDate);
      return rd && isSameDay(rd, d);
    });
    const listings = ipoList.filter((item) => {
      const ld = parseDate(item.listingDate);
      return ld && isSameDay(ld, d);
    });

    if (!subscriptions.length && !refunds.length && !listings.length) return null;

    return (
      <div className="flex flex-col items-center mt-1 gap-1">
        {subscriptions.map((item, i) => (
          <span key={`s${i}`} className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 leading-tight text-center break-keep whitespace-normal w-full">
            {item.name}
          </span>
        ))}
        {refunds.map((item, i) => (
          <span key={`r${i}`} className="text-xs bg-orange-400 text-white rounded px-1 py-0.5 leading-tight text-center break-keep whitespace-normal w-full">
            환불 {item.name}
          </span>
        ))}
        {listings.map((item, i) => (
          <span key={`l${i}`} className="text-xs bg-green-500 text-white rounded px-1 py-0.5 leading-tight text-center break-keep whitespace-normal w-full">
            상장 {item.name}
          </span>
        ))}
      </div>
    );
  }

  function handleDateClick(d: Date) {
    setDate(d);
    const items = ipoList.filter((item) => {
      const range = parseDates(item.period);
      if (!range) return false;
      return d >= range.start && d <= range.end;
    });
    setSelected(items);
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
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "calendar" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📅 캘린더
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list" ? "bg-blue-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
              }`}
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
              <Calendar
                onChange={(v) => handleDateClick(v as Date)}
                value={date}
                tileContent={getTileContent}
                locale="ko-KR"
                formatDay={(_, date) => date.getDate().toString()}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) setCurrentMonth(activeStartDate);
                }}
              />
              {selected.length > 0 && (
                <div className="w-full">
                  <IpoTable items={selected} />
                </div>
              )}
            </>
          ) : (
            <div className="w-full">
              <h2 className="text-lg font-bold text-gray-700 mb-3">
                {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월 공모주 목록
                <span className="ml-2 text-sm font-normal text-gray-400">({monthItems.length}건)</span>
              </h2>
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