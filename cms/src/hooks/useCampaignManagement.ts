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

  // --- LOGIKA FILTERING, SEARCHING, & SORTING ---
  const processedData = useMemo(() => {
    let result = [...initialCampaigns];

    // 1. Filter Berdasarkan Tab (Status Visual)
    if (filter !== "all") {
      result = result.filter((item) => visualStatus(item) === filter);
    }

    // 2. Search Berdasarkan Judul, Kategori, atau Lokasi
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.disasterType.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query),
      );
    }
