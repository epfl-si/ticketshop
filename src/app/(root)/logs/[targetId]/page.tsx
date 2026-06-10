"use client";

import LogsPageView from "@/views/log";
import { useParams } from "next/navigation";

export default function LogsPage() {
    const params = useParams();
    const targetID = params.targetId as string;
    return <LogsPageView targetID={targetID} />;
}
