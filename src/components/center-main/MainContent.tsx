import { Routes, Route, useLocation } from "@solidjs/router";
import Management from "../../pages/Management";
import Transactions from "../../pages/Transactions";
import Assets from "../../pages/Assets";
import { createEffect, createMemo, createSignal } from "solid-js";
import SaturnCard from "../legos/SaturnCard";
import { getAllMembers } from "../../utils/getAllMembers";
import { useSaturnContext } from "../../providers/saturnProvider";
import { PagesEnum } from "../../pages/pages";
import { useSelectedAccountContext } from "../../providers/selectedAccountProvider";
import Welcome from "../../pages/Welcome";

const MainContent = () => {
  const [membersCount, setMembersCount] = createSignal(0);

  const saturnContext = useSaturnContext();
  const selectedAccountContext = useSelectedAccountContext();
  const loc = useLocation();

  const currentPage = createMemo(() => loc.pathname);
  const isLoggedIn = createMemo(() => !!selectedAccountContext.state.account?.address);

  function pageTitle() {
    if (!isLoggedIn()) return '';
    if (currentPage().endsWith(`/${ PagesEnum.ASSETS }`)) {
      return 'Assets';
    } else if (currentPage().endsWith(`/${ PagesEnum.TRANSACTIONS }`)) {
      return 'Transactions';
    } else if (currentPage().endsWith(`/${ PagesEnum.MANAGEMENT }`)) {
      return ''; // Handle page title from Management.tsx
    } else {
      return 'Page not found!';
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
        element={isLoggedIn() ? <Assets /> : <Welcome />}
      />
      <Route
        path={PagesEnum.TRANSACTIONS}
        element={isLoggedIn() ? <Transactions /> : <Welcome />}
      />
      <Route
        path={PagesEnum.MANAGEMENT}
        element={isLoggedIn() ? <Management /> : <Welcome />}
      />
    </Routes>
  </SaturnCard>;
};

MainContent.displayName = 'MainContent';
export default MainContent;