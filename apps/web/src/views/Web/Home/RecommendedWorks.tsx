import { useState, useEffect } from "react";
import CinematicCarousel, { Slide } from "@/features/common/CinematicCarousel";
import { getWorkPage } from "@/api/web";
import { mapWorkToBrief } from "@/mappers/work";

export default function RecommendedWorks() {
  const [slides, setSlides] = useState<Slide[]>([]);
  useEffect(() => {
    getWorkPage().then((res) => {
      const data = res.data
        .splice(0, 6)
        .filter((i) => i)
        .map((i) => mapWorkToBrief(i));
      setSlides(data);
    });
  }, []);

  return <CinematicCarousel slides={slides} interval={0} basePath="" />;
}
