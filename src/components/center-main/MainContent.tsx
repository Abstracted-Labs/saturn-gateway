import { Routes, Route, useLocation } from "@solidjs/router";
import Members from "../../pages/Members";
import Transactions from "../../pages/Transactions";
import Assets from "../../pages/Assets";
import { createEffect, createMemo, createSignal } from "solid-js";
import SaturnCard from "../legos/SaturnCard";
import { getAllMembers } from "../../utils/getAllMembers";
import { useSaturnContext } from "../../providers/saturnProvider";

const MainContent = () => {
  const [membersCount, setMembersCount] = createSignal(0);
  const saturnContext = useSaturnContext();
  const location = useLocation();
  const currentPage = createMemo(() => location.pathname);

  function pageTitle() {
    if (currentPage().endsWith('/assets')) {
      return 'Assets';
    } else if (currentPage().endsWith('/transactions')) {
      return 'Transactions';
    } else if (currentPage().endsWith('/members')) {
      return '';
    } else {
      return '...';
    }
  };

  createEffect(() => {
    const saturn = saturnContext.state.saturn;
    const multisigId = saturnContext.state.multisigId;
    const runAsync = async () => {
      if (!saturn || !multisigId) return;

      const members = await getAllMembers(multisigId, saturn);
      setMembersCount(members.length);
    };

    runAsync();
  });

  return <SaturnCard header={pageTitle()}>
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
  </SaturnCard>;
};

MainContent.displayName = 'MainContent';
export default MainContent;