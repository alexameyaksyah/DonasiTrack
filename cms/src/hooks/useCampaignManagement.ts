"use client";

import { useState, useMemo } from "react";
import { Campaign, FilterKey, SortBy } from "../types/campaign";
import { visualStatus } from "../lib/campaign-utils";

export function useCampaignManagement(initialCampaigns: Campaign[]) {
  // --- STATE DASAR DASHBOARD ---
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

