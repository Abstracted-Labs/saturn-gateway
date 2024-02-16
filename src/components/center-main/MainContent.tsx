import { Routes, Route, useLocation } from "@solidjs/router";
import Management from "../../pages/Management";
import Transactions from "../../pages/Transactions";
import Assets from "../../pages/Assets";
import { createEffect, createMemo, createSignal } from "solid-js";
import SaturnCard from "../legos/SaturnCard";
import { getAllMembers } from "../../utils/getAllMembers";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PagesEnum } from "../../pages/pages";

const MainContent = () => {
  const [membersCount, setMembersCount] = createSignal(0);

  const saturnContext = useSaturnContext();
  const loc = useLocation();

  const currentPage = createMemo(() => loc.pathname);

  function pageTitle() {
    if (currentPage().endsWith(`/${ PagesEnum.ASSETS }`)) {
      return 'Assets';
    } else if (currentPage().endsWith(`/${ PagesEnum.TRANSACTIONS }`)) {
      return 'Transactions';
    } else if (currentPage().endsWith(`/${ PagesEnum.MANAGEMENT }`)) {
      return ''; // Handle page title from Management.tsx
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
        path={PagesEnum.ASSETS}
        element={
          <Assets />
        }
      />
      <Route
        path={PagesEnum.TRANSACTIONS}
        element={
          <Transactions />
        }
      />
      <Route
        path={PagesEnum.MANAGEMENT}
        element={<Management />}
      />
    </Routes>
  </SaturnCard>;
};

MainContent.displayName = 'MainContent';
export default MainContent;