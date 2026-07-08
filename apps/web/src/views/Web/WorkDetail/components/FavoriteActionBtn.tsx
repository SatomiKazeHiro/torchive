import { BiHeart, BiSolidHeart } from "react-icons/bi";

import { Button } from "@/components";
import FavoriteAction from "@/features/user-library/FavoriteAction";

interface FavoriteActionBtnProps {
  work: Work;
}

export default function FavoriteActionBtn({ work }: FavoriteActionBtnProps) {
  return (
    <FavoriteAction work={work}>
      {({ isActive, toggle, loading }) => (
        <Button variant="outline" size="md" onClick={toggle} disabled={loading}>
          <div className="flex items-center">
            {isActive ? (
              <BiSolidHeart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            ) : (
              <BiHeart className="h-3.5 w-3.5 fill-zinc-900 text-zinc-900" />
            )}
            <span className="ml-1.5">{isActive ? "已收藏" : "收藏"}</span>
          </div>
        </Button>
      )}
    </FavoriteAction>
  );
}
