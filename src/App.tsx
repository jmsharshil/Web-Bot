import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useSarvamEnvBootstrap } from "@/hooks/use-sarvam-env";
import { getAgentByHostname, getEnvWebAgents } from "@/lib/sarvam/agents";
import { UserDetailsPage } from "@/pages/UserDetailsPage";
import { VoiceStudioPage } from "@/pages/VoiceStudioPage";

export function App() {
  const hostAgent = getAgentByHostname(
    getEnvWebAgents(),
    window.location.hostname,
  );

  if (hostAgent) {
    return (
      <Routes>
        <Route path="/" element={<UserDetailsPage nextPath="/studio" />} />
        <Route
          path="/studio"
          element={<VoiceStudioPage lockedAgentId={hostAgent.id} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<CredentialsBootstrap />}>
        <Route path="/" element={<UserDetailsPage nextPath="/studio" />} />
        <Route path="/studio" element={<VoiceStudioPage />} />
        <Route
          path="/pondpro"
          element={<VoiceStudioPage initialAgentId="pondpro" />}
        />
        <Route path="/agent/:slug" element={<VoiceStudioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function CredentialsBootstrap() {
  useSarvamEnvBootstrap();
  return <Outlet />;
}
