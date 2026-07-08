import { BiTimeFive, BiSolidTimeFive  } from "react-icons/bi";

import { Button } from "@/components";
import WatchLaterAction from "@/features/user-library/WatchLaterAction";

interface WatchLaterActionBtnProps {
  work: Work;
}

export default function WatchLaterActionBtn({ work }: WatchLaterActionBtnProps) {
  return (
    <WatchLaterAction work={work}>
      {({ isActive, toggle, loading }) => (
        <Button variant="outline" size="md" onClick={toggle} disabled={loading}>
          <div className="flex items-center">
            {isActive ? (
              <BiSolidTimeFive className="h-3.5 w-3.5 fill-deep-black text-deep-black" />
            ) : (
              <BiTimeFive className="h-3.5 w-3.5 fill-zinc-900 text-zinc-900" />
            )}
            <span className="ml-1.5">{isActive ? "已稍后再看" : "稍后再看"}</span>
          </div>
        </Button>
      )}
    </WatchLaterAction>
  );
}
