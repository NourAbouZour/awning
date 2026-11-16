import { Card } from "@/components/dashboard/page-header";
import { listPasswordResets, listSupportRequests } from "@/server/admin";
import { PasswordResets } from "../password-resets";
import { AdminMessagesClient } from "./messages-client";

export default async function AdminMessagesPage() {
  const [messages, passwordResets] = await Promise.all([
    listSupportRequests(),
    listPasswordResets(),
  ]);
  return (
    <AdminMessagesClient
      messages={messages}
      top={
        <Card className="mb-6">
          <div className="px-5 pt-5">
            <h2 className="text-sm font-semibold text-ink">
              Forgot password
              {passwordResets.length > 0 && (
                <span className="ml-2 rounded-full bg-warn px-2 py-0.5 text-[11px] font-semibold text-white">
                  {passwordResets.length} waiting
                </span>
              )}
            </h2>
          </div>
          <div className="mt-2">
            <PasswordResets requests={passwordResets} />
          </div>
        </Card>
      }
    />
  );
}
