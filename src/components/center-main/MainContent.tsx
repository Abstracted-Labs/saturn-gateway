import { Routes, Route, useLocation } from "@solidjs/router";
import Members from "../../pages/Members";
import Transactions from "../../pages/Transactions";
import Assets from "../../pages/Assets";
import { createMemo } from "solid-js";
import RoundedCard from "../legos/RoundedCard";

const MainContent = () => {
  const location = useLocation();
  const currentPage = createMemo(() => location.pathname);
  const pageTitle = () => {
    if (currentPage().endsWith('/assets')) {
      return 'Assets';
    } else if (currentPage().endsWith('/transactions')) {
      return 'Transactions';
    } else if (currentPage().endsWith('/members')) {
      return 'Members';
    } else {
      return '...';
    }
  };

  return <RoundedCard header={pageTitle()}>
    <Routes>
      <Route
        path="assets"
        element={
          <Assets />
        }
      />
      <Route
        path="transactions"
        element={
          <Transactions />
        }
      />
      <Route
        path="members"
        element={<Members />}
      />
    </Routes>
  </RoundedCard>;
};

MainContent.displayName = 'MainContent';
export default MainContent;