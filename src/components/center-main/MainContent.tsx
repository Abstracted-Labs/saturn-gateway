import { Routes, Route } from "@solidjs/router";
import Members from "../../pages/Members";
import Transactions from "../../pages/Transactions";
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
        path='Transactions'
        element={
          <Transactions />
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