import RecommendedWorks from "./RecommendedWorks";
import DomainList from "./DomainList";

function HomeView() {
  return (
    <div id="home-page" className="pb-20">
      <RecommendedWorks />
      <DomainList />
    </div>
  );
}

export default HomeView;
