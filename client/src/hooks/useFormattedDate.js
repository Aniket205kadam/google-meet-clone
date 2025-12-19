import { useEffect, useState } from "react";

export const useFormattedDate = () => {
  const formatTime = () => {
    const date = new Date();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = days[date.getDay()];

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = months[date.getMonth()];

    const day = String(date.getDate()).padStart(2, "0");

    return `${hours}:${minutes} - ${dayName} ${day} ${monthName}`;
  };

  const [currentTime, setCurrentTime] = useState(formatTime);

  useEffect(() => {
    // Update every 1 min (60000ms)
    const interval = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000); // you can switch to 60000 if you want minute-level updates

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};
