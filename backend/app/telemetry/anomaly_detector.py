"""
Lightweight statistical anomaly detector.
Tracks per-user request frequency and flags outliers (>2σ deviation).
No external ML libraries required — pure rolling statistics.
"""
from collections import defaultdict
from datetime import datetime, timedelta
import math
from typing import Optional
from app.models.event import SecurityEvent


class AnomalyDetector:
    def __init__(self, window_minutes: int = 5, sigma_threshold: float = 2.0):
        self.window = timedelta(minutes=window_minutes)
        self.sigma = sigma_threshold
        # user_id -> list of timestamps
        self._user_ts: dict[str, list[datetime]] = defaultdict(list)
        # ip -> list of timestamps
        self._ip_ts: dict[str, list[datetime]] = defaultdict(list)
        # endpoint -> list of timestamps
        self._ep_ts: dict[str, list[datetime]] = defaultdict(list)
        # Rolling stats: key -> (count_sum, count_sq_sum, n_windows)
        self._user_baseline: dict[str, tuple[float, float, int]] = defaultdict(lambda: (0.0, 0.0, 0))

    def _prune(self, ts_list: list[datetime], now: datetime) -> list[datetime]:
        cutoff = now - self.window
        return [t for t in ts_list if t > cutoff]

    def _rate(self, ts_list: list[datetime]) -> int:
        return len(ts_list)

    def _update_baseline(self, key: str, current_rate: float):
        s, sq, n = self._user_baseline[key]
        s += current_rate
        sq += current_rate ** 2
        n += 1
        self._user_baseline[key] = (s, sq, n)

    def _is_anomalous(self, key: str, current_rate: float) -> bool:
        s, sq, n = self._user_baseline[key]
        if n < 3:
            return False  # Not enough data
        mean = s / n
        variance = (sq / n) - (mean ** 2)
        std = math.sqrt(max(variance, 0))
        if std == 0:
            return current_rate > mean * 2
        return current_rate > mean + self.sigma * std

    def ingest(self, event: SecurityEvent) -> dict:
        """Ingest an event and return anomaly flags."""
        now = datetime.utcnow()
        anomalies = []

        # Track user request rate
        if event.user_id:
            self._user_ts[event.user_id] = self._prune(self._user_ts[event.user_id], now)
            self._user_ts[event.user_id].append(now)
            rate = self._rate(self._user_ts[event.user_id])
            if self._is_anomalous(f"user:{event.user_id}", rate):
                anomalies.append({
                    "type": "user_rate_anomaly",
                    "user_id": event.user_id,
                    "current_rate": rate,
                    "message": f"User {event.user_id} request rate ({rate}/5min) exceeds baseline"
                })
            self._update_baseline(f"user:{event.user_id}", rate)

        # Track IP request rate
        if event.ip_address:
            self._ip_ts[event.ip_address] = self._prune(self._ip_ts[event.ip_address], now)
            self._ip_ts[event.ip_address].append(now)
            rate = self._rate(self._ip_ts[event.ip_address])
            if self._is_anomalous(f"ip:{event.ip_address}", rate):
                anomalies.append({
                    "type": "ip_rate_anomaly",
                    "ip_address": event.ip_address,
                    "current_rate": rate,
                    "message": f"IP {event.ip_address} request rate ({rate}/5min) exceeds baseline"
                })
            self._update_baseline(f"ip:{event.ip_address}", rate)

        # Track endpoint access rate
        if event.endpoint:
            self._ep_ts[event.endpoint] = self._prune(self._ep_ts[event.endpoint], now)
            self._ep_ts[event.endpoint].append(now)
            rate = self._rate(self._ep_ts[event.endpoint])
            if self._is_anomalous(f"ep:{event.endpoint}", rate):
                anomalies.append({
                    "type": "endpoint_rate_anomaly",
                    "endpoint": event.endpoint,
                    "current_rate": rate,
                    "message": f"Endpoint {event.endpoint} access rate ({rate}/5min) exceeds baseline"
                })
            self._update_baseline(f"ep:{event.endpoint}", rate)

        return {
            "has_anomaly": len(anomalies) > 0,
            "anomalies": anomalies,
            "event_id": event.event_id
        }

    def get_stats(self) -> dict:
        """Return current detector statistics."""
        return {
            "tracked_users": len(self._user_ts),
            "tracked_ips": len(self._ip_ts),
            "tracked_endpoints": len(self._ep_ts),
            "baseline_entries": len(self._user_baseline),
        }


anomaly_detector = AnomalyDetector()
