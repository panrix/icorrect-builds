# Air vs Pro/Max Power Architecture Comparison

## Air/Base Boards (A2337, A2338, A2338_M2, A2681, A3113, A3114)

### Power Topology
- **Input**: 2x USB-C + MagSafe (no HDMI, no SD card)
- **Main bus**: PPBUS_AON from charger IC (single charger)
- **3V8 rail**: U5700 SVR AON (30A max) -> PP3V8_AON
- **PMUs**: SPMU (U7700) + MPMU (U8100) directly from PP3V8_AON
- **SoC power**: MPMU bucks feed PCPU, ECPU, GPU, SRAM directly
- **No VR modules**: No Viper VR, no Monaco VR
- **5V/3V3**: UC300 (5V), UC710 (3.3V) from PPBUS_AON
- **Storage**: Single SSD (2 NAND packages)

### Power Sequence
1. USB-C 5V -> UF400/UF500 -> Charger IC -> PPBUS_AON
2. PPBUS_AON -> U5700 -> PP3V8_AON
3. PP3V8_AON -> SPMU/MPMU -> AON/S2/S1 rails
4. UC300/UC710 -> PP5V_S2/PP3V3_S2
5. MPMU DVFS bucks -> SoC AWAKE domains
6. SoC boot -> PD negotiation -> 20V boost

### Generation Differences
| Feature | M1 (A2337) | M2 (A2681) | M3 (A3113/A3114) |
|---------|-----------|-----------|-----------------|
| Rail prefix | MAME | MAME | AWAKE |
| WiFi | Heron | Typhoon | Willamette |
| MagSafe ctrl | AAROXA9PA0830 | AAROXA9PA0830 | ACE3 (U5900) |
| USB-C retimer | Separate | UF600 repeater | MACAW (UF600/UF650) |
| Boost rail | 3.8V | 3.8V | 5.0V |
| LDOINT | 1.05V | 1.05V | 1.5V |
| VDD_FIXED | 0.75V | 0.75V | 0.78V |

## Pro/Max Boards (A2442, A2442_CTO, A2485, A2485_EVTc, A2779, A2779_S, A2780)

### Power Topology
- **Input**: 3x USB-C + MagSafe + HDMI + SD card
- **Main bus**: PPBUS_AON from charger IC
- **3V8 rail**: U5700 SVR AON (30A+ max) -> PP3V8_AON
- **PMUs**: SPMU (U7700, 22+ bucks) + MPMU (U8100) from PP3V8_AON
- **Viper VR**: U9300 multi-phase for high-current PCPU domains (not on base M3 Pro)
- **Monaco VR**: Multiple instances for GPU/fabric domains (Max variants)
- **5V/3V3**: TPS62130 (5V), separate 3V3 regulator
- **Storage**: Dual SSD with Ocarina controller (4 NAND packages each)
- **Additional**: Fan controller, TouchID, HDMI retimer (Madea/Cobra)

### Power Sequence
1. USB-C 5V -> UF400/UF500/UG400 -> Charger IC -> PPBUS_AON
2. PPBUS_AON -> U5700 -> PP3V8_AON
3. PP3V8_AON -> SPMU/MPMU -> AON/S2/S1 rails
4. PP3V8_AON -> Viper VR (U9300) -> PCPU domains
5. MPMU -> Monaco VR -> GPU/fabric domains
6. TPS62130 -> PP5V_S2
7. SoC boot -> PD negotiation -> 20V boost

### Key Architectural Differences

| Feature | Air/Base | Pro/Max |
|---------|----------|---------|
| USB-C ports | 2 | 3 |
| HDMI | No | Yes |
| SD card | No | Yes |
| Viper VR | No | Yes (except M3 Pro base) |
| Monaco VR | No | Yes (Max only) |
| SPMU bucks | ~14 | 22+ |
| SSD controllers | 1 | 2 (Ocarina) |
| NAND packages | 2 | Up to 8 |
| Fan | No | Yes |
| TouchID | No | Yes |
| Thermal sensors | ~13 | ~20+ |
| Power aliases pages | 4 | 5+ |

### Standard vs Max Variants
- **Standard (Pro)**: No Monaco VR, fewer GPU power phases
- **Max**: Full Monaco VR for GPU clusters, additional SRAM power phases
- **A2779_S**: Explicitly Standard-only variant (no Max BOM options)

## M3 Pro Hybrid Architecture (A2918)

**A2918** (MacBook Pro 14" M3 Pro/Max) is a Pro-class board but does NOT follow the Viper/Monaco VR pattern of M1/M2 Pro boards.

### Power Topology
- **Input**: 3x USB-C + MagSafe + HDMI + SD card (same I/O as other Pro boards)
- **Main bus**: PPBUS_AON from charger IC
- **3V8 rail**: U5700 SVR AON -> PP3V8_AON
- **PMUs**: SPMU + MPMU from PP3V8_AON
- **No Viper VR**: PCPU domains fed directly from PMU bucks (closer to Air topology)
- **No Monaco VR**: GPU/fabric domains fed directly from PMU bucks
- **Storage**: Dual SSD
- **Additional**: Fan controller, TouchID, HDMI retimer

### Why This Matters for Diagnostics
- Do not expect Viper/Monaco fault patterns on A2918
- PCPU and GPU power faults trace to PMU bucks directly, not to external VR controllers
- Power sequence is simpler than M1/M2 Pro (no VR startup stage between PMU and SoC)
- Despite being a Pro board with Pro I/O (3 USB-C, HDMI, SD), the internal power delivery resembles the Air/Base architecture
