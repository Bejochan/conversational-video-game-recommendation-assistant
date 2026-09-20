"""
recommendation_algorithm.py — Engine Playstyle DNA & Hybrid Recommendation
Dimuat satu kali (singleton) saat server Flask dinyalakan.
"""

import numpy as np
import pandas as pd
from backend.config import DATASET_PATH


class RecommendationEngine:
    """
    Memuat dataset, menghitung Playstyle DNA untuk setiap game,
    dan menyediakan metode untuk mencari rekomendasi terbaik
    berdasarkan profil DNA + mood + genre + budget pengguna.
    """

    def __init__(self):
        self._df = self._load_and_clean()
        self._df = self._precompute_all_dna(self._df)
        print(f"✅ RecommendationEngine siap: {len(self._df):,} game dimuat.")

    # ── Load & Clean ─────────────────────────────────────────────────────────

    def _load_and_clean(self) -> pd.DataFrame:
        """Memuat games.csv dan membersihkan nilai null pada kolom numerik."""
        df = pd.read_csv(DATASET_PATH)

        numeric_cols = {
            "price_idr": 0.0,
            "original_price_idr": 0.0,
            "discount_percent": 0.0,
            "rating": 0.0,
            "ratings_count": 0,
            "metacritic": 0.0,
        }
        for col, default in numeric_cols.items():
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(default)

        df["genres"] = df["genres"].fillna("")
        df["platforms"] = df["platforms"].fillna("Unknown")
        df["background_image"] = df["background_image"].fillna("")
        df["released"] = df["released"].fillna("")
        df["name"] = df["name"].fillna("Unknown")

        return df

    # ── DNA Precomputation ───────────────────────────────────────────────────

    @staticmethod
    def _compute_dna_row(row) -> pd.Series:
        """
        Menghitung vektor DNA 3D untuk satu baris game:
          - dna_hardcore   (0.0 = Casual,   1.0 = Hardcore)
          - dna_complex    (0.0 = Simple,    1.0 = Complex)
          - dna_adrenaline (0.0 = Calming,   1.0 = Adrenaline)
        """
        genres = [g.strip().lower() for g in str(row["genres"]).split(",") if g.strip()]

        # 1. Casual vs Hardcore
        ch = 0.5
        for g in genres:
            if g in {"rpg", "strategy", "shooter", "simulation", "massively multiplayer"}:
                ch += 0.15
            elif g in {"casual", "puzzle", "arcade", "educational", "card", "board games", "family"}:
                ch -= 0.15
        if row["ratings_count"] > 1000:
            ch += 0.05
        if row["metacritic"] > 80:
            ch += 0.05

        # 2. Simple vs Complex
        sc = 0.5
        for g in genres:
            if g in {"strategy", "rpg", "simulation", "massively multiplayer"}:
                sc += 0.20
            elif g in {"arcade", "action", "platformer", "casual", "puzzle", "racing"}:
                sc -= 0.10

        # 3. Calming vs Adrenaline
        ca = 0.5
        for g in genres:
            if g in {"shooter", "action", "fighting", "racing", "sports"}:
                ca += 0.20
            elif g in {"casual", "puzzle", "simulation", "adventure", "family"}:
                ca -= 0.15

        return pd.Series(
            [float(np.clip(ch, 0, 1)), float(np.clip(sc, 0, 1)), float(np.clip(ca, 0, 1))]
        )

    def _precompute_all_dna(self, df: pd.DataFrame) -> pd.DataFrame:
        print("⏳ Menghitung Playstyle DNA untuk seluruh game...")
        df[["dna_hardcore", "dna_complex", "dna_adrenaline"]] = df.apply(
            self._compute_dna_row, axis=1
        )
        print("✅ Prekomputasi DNA selesai!")
        return df

    # ── Mood Modifier ────────────────────────────────────────────────────────

    @staticmethod
    def apply_mood_modifier(dna: dict, mood: str | None) -> dict:
        """
        Memodifikasi vektor DNA pengguna berdasarkan pilihan mood sesaat.
        Mood yang didukung: relaxed, competitive, immersive, focused.
        """
        adj = dna.copy()
        mood = (mood or "").lower()

        if mood == "relaxed":
            adj["hardcore"] = max(0.0, adj["hardcore"] - 0.25)
            adj["complex"] = max(0.0, adj["complex"] - 0.20)
            adj["adrenaline"] = max(0.0, adj["adrenaline"] - 0.30)
        elif mood == "competitive":
            adj["hardcore"] = min(1.0, adj["hardcore"] + 0.30)
            adj["complex"] = min(1.0, adj["complex"] + 0.15)
            adj["adrenaline"] = min(1.0, adj["adrenaline"] + 0.30)
        elif mood == "immersive":
            adj["hardcore"] = min(1.0, adj["hardcore"] + 0.10)
            adj["complex"] = min(1.0, adj["complex"] + 0.25)
            adj["adrenaline"] = max(0.0, adj["adrenaline"] - 0.10)
        elif mood == "focused":
            adj["hardcore"] = min(1.0, adj["hardcore"] + 0.20)
            adj["complex"] = min(1.0, adj["complex"] + 0.20)
            adj["adrenaline"] = max(0.0, adj["adrenaline"] - 0.05)

        return adj

    # ── Recommendation ───────────────────────────────────────────────────────

    def get_recommendations(self, user_pref: dict, top_n: int = 6) -> dict:
        """
        Menghitung skor multi-aspek untuk setiap game dan mengembalikan top_n
        game terbaik beserta koordinat DNA yang telah disesuaikan mood.

        Args:
            user_pref: dict dari hasil ekstraksi LLM
                {
                  "mood": str | None,
                  "pref_genres": list[str],
                  "max_budget": int | None,
                  "dna_estimate": {"hardcore": float, "complex": float, "adrenaline": float}
                }
            top_n: jumlah game yang dikembalikan

        Returns:
            {
              "games": list[dict],
              "adjusted_dna": dict,
              "mood_applied": str
            }
        """
        df = self._df.copy()

        pref_genres = [g.lower() for g in user_pref.get("pref_genres", [])]
        mood = user_pref.get("mood")
        max_budget = user_pref.get("max_budget")
        raw_dna = user_pref.get(
            "dna_estimate", {"hardcore": 0.5, "complex": 0.5, "adrenaline": 0.5}
        )

        adj_dna = self.apply_mood_modifier(raw_dna, mood)
        user_vec = np.array([adj_dna["hardcore"], adj_dna["complex"], adj_dna["adrenaline"]])

        # ── Genre Match ──
        if pref_genres:
            def _genre_score(g_str):
                g_list = [x.strip().lower() for x in str(g_str).split(",") if x.strip()]
                hits = sum(1 for x in g_list if any(p in x for p in pref_genres))
                return min(1.0, hits / len(pref_genres))
            df["score_genre"] = df["genres"].apply(_genre_score)
        else:
            df["score_genre"] = 0.5

        # ── DNA Match (Euclidean Distance) ──
        game_matrix = df[["dna_hardcore", "dna_complex", "dna_adrenaline"]].values
        distances = np.linalg.norm(game_matrix - user_vec, axis=1)
        df["score_dna"] = np.clip(1.0 - (distances / np.sqrt(3)), 0.0, 1.0)

        # ── Rating Score ──
        meta_norm = df["metacritic"] / 100.0
        rawg_norm = df["rating"] / 5.0
        df["score_rating"] = np.where(
            df["metacritic"] > 0,
            (meta_norm * 0.6) + (rawg_norm * 0.4),
            rawg_norm,
        )

        # ── Price Score ──
        if max_budget and max_budget > 0:
            def _price_score(row):
                p = row["price_idr"]
                if p == 0:
                    return 1.0
                if p <= max_budget:
                    return min(1.0, 0.90 + (row["discount_percent"] / 100.0) * 0.10)
                penalty = (p - max_budget) / max_budget
                return max(0.0, 1.0 - penalty)
            df["score_price"] = df.apply(_price_score, axis=1)
        else:
            df["score_price"] = 0.7

        # ── Weighted Total ──
        w_g = 0.30 if pref_genres else 0.10
        w_d = 0.40
        w_r = 0.20
        w_p = 0.10 if max_budget else 0.05
        total_w = w_g + w_d + w_r + w_p

        df["match_score"] = (
            df["score_genre"] * w_g
            + df["score_dna"] * w_d
            + df["score_rating"] * w_r
            + df["score_price"] * w_p
        ) / total_w

        top = df.sort_values("match_score", ascending=False).head(top_n)

        games = []
        for _, row in top.iterrows():
            score = float(row["match_score"])
            if score >= 0.85:
                match_label = "Sangat Tinggi"
            elif score >= 0.70:
                match_label = "Tinggi"
            else:
                match_label = "Cukup Tinggi"

            steam_id = row["steam_appid"]
            try:
                steam_id = int(steam_id) if not pd.isna(steam_id) else None
            except (ValueError, TypeError):
                steam_id = None

            games.append(
                {
                    "id": int(row["id"]),
                    "title": row["name"],
                    "released": row["released"],
                    "genres": row["genres"],
                    "platforms": row["platforms"],
                    "rating": round(float(row["rating"]), 2),
                    "metacritic": int(row["metacritic"]),
                    "cover_url": row["background_image"],
                    "steam_appid": steam_id,
                    "price_idr": float(row["price_idr"]),
                    "original_price_idr": float(row["original_price_idr"]),
                    "discount_percent": float(row["discount_percent"]),
                    "match_score": round(score * 100, 1),
                    "match_label": match_label,
                    "dna": {
                        "hardcore": round(float(row["dna_hardcore"]), 2),
                        "complex": round(float(row["dna_complex"]), 2),
                        "adrenaline": round(float(row["dna_adrenaline"]), 2),
                    },
                }
            )

        return {
            "games": games,
            "adjusted_dna": {k: round(v, 2) for k, v in adj_dna.items()},
            "mood_applied": mood or "none",
        }

    def get_available_genres(self) -> list[str]:
        """Mengembalikan daftar genre unik dari dataset (untuk UI filter)."""
        all_genres = set()
        for g_str in self._df["genres"].dropna():
            for g in g_str.split(","):
                g = g.strip()
                if g:
                    all_genres.add(g)
        return sorted(all_genres)


# ── Singleton instance ──────────────────────────────────────────────────────
engine = RecommendationEngine()
