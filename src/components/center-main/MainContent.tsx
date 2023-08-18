import { Routes, Route } from "@solidjs/router";
import Members from "../../pages/Members";
import Queue from "../../pages/Queue";
import Assets from "../../pages/Assets";

const MainContent = () => {
  return <div>
    <Routes>
      <Route
        path='assets'
        element={
          <Assets />
        }
      />
      <Route
        path='queue'
        element={
          <Queue />
        }
      />
      <Route
        path="members"
        element={<Members />}
      />
    </Routes>
  </div>;
};
MainContent.displayName = 'MainContent';
export default MainContent;