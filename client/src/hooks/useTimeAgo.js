import { useState, useEffect } from "react";

// Hook: useTimeAgo
export const useTimeAgo = (dateString) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = new Date(dateString);
      const diff = Math.floor((now - date) / 1000); // difference in seconds

      let display = "";
      if (diff < 60) display = `${diff} sec ago`;
      else if (diff < 3600) display = `${Math.floor(diff / 60)} min ago`;
      else if (diff < 86400) display = `${Math.floor(diff / 3600)} hour ago`;
      else display = `${Math.floor(diff / 86400)} day ago`;

      setTimeAgo(display);
    };

    updateTime(); // initial update
    const interval = setInterval(updateTime, 60000); // update every minute

    return () => clearInterval(interval);
  }, [dateString]);

  return timeAgo;
};
