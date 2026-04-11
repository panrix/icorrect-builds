# Common Power Faults Mapped to Measurement Points

## Universal Faults (All Boards)

### F1: No PPBUS_AON (Dead Board)
- **Symptom**: 0A at 5V or 20V DCPS
- **Probe**: C5704 (most boards) for PPBUS_AON
- **Causes**:
  - Port controller (UF400/UF500) dead or SPI ROM short
  - Charger IC (U5200 area) failure
  - BMU SYS_DETECT circuit (J5150) not enabling battery
  - Fuse blown: DF400/DF500 (USB-C), F5600/F5601 (MagSafe)
- **Fix**: Replace port controller, check fuses, verify CC line continuity

### F2: PP3V8_AON Short (Most Common Power Fault)
- **Symptom**: 0.05-0.5A at 20V, PP3V8_AON missing or low
- **Probe**: C8450 (A2681), check board-specific cap for PP3V8_AON
- **Known short locations**:
  - C7705 (VDDMAIN branch) -- especially common on A2681/A3113
  - PP3V8_AON_WLBT branch (WiFi module internal short)
  - SPMU/MPMU input cap array
- **Diagnostic**: Diode mode on PP3V8_AON, thermal camera
- **Fix**: Replace shorted capacitor or WiFi module. If U5700 dead, replace.

### F3: PP5V_S2 Missing (Boot Stall)
- **Symptom**: 0.1-0.5A at 20V, PP5V_S2 not present
- **Probe**: C8440 (A2681), check UC300 output
- **Causes**:
  - UC300 dead
  - P5VS2_PWR_EN not asserted (PMU GPIO fault)
  - C8430 shorted, L8430 open (A2681 specific)
  - PMU_CRASH_L asserted (blocks enable on M3 boards via UC637/UC630)
- **Fix**: Check enable gating logic, replace UC300 if needed

### F4: MPMU/SPMU LDO Short
- **Symptom**: 0.1-0.3A at 20V, specific LDO output missing
- **Probe**: Board-specific LDO test point caps
- **Common test points** (A2681): C8320 (1.8V LDO9), C8330 (3.3V LDO13), C8360 (1.2V LDO9B)
- **Fix**: Thermal camera on the faulted LDO rail. Replace hot component. If no hot spot, PMU dead.

### F5: NAND/SSD Power Fault (Boot Loop)
- **Symptom**: 0.5-1.5A cycling, board repeatedly starts/stops boot
- **Rails to check**:
  - Air: PP1V25_AWAKE_NAND_VCC (SPMU BUCK 6), PP3V8_AWAKE_NAND_VDD (SPMU BUCK 12 SW6/7)
  - Pro/Max: Similar + Ocarina controller power
- **Fix**: Check NAND fuses (FL4000/FL4001), NAND power ICs, try DFU restore

### F6: Display Path Failure (No Image at Normal Current)
- **Symptom**: 1.5-3A normal current, no display
- **Check chain**:
  1. PPBUS_AONSW_LCD (UP950 load switch) -- backlight input
  2. BEN controller output (U6560/LP800) -- backlight drive
  3. Display PMU (U6600/San Diego) -- panel power (AVDD, VGH, VGL)
  4. eDP connector seating
- **Fix**: Check each stage in order. Most common: UP950 enable fault, BEN inductor open, display flex connector.

## Pro/Max Specific Faults

### F7: Viper VR Fault (High Current SoC Domain)
- **Symptom**: 0.3-1A at 20V, SoC doesn't fully wake
- **Probe**: Viper VR (U9300) output -- PPVDD_PCPU domains
- **Fix**: Check Viper enable signals, thermal cam Viper output stages

### F8: Monaco VR Fault (GPU Domain, Max Only)
- **Symptom**: Board boots but GPU performance degraded or crash under load
- **Probe**: Monaco buck outputs (PPVDD_AGXS, PPVDD_S0VE, etc.)
- **Fix**: Check Monaco VR instances, thermal cam GPU power area

### F9: HDMI Retimer Fault
- **Symptom**: No HDMI output, board otherwise functional
- **Probe**: Madea/Cobra (UH700) power and I2C
- **Fix**: Check retimer power supply, I2C communication, reflow/replace retimer

## M3 Generation Specific Notes

- Rail naming changed from MAME to AWAKE (e.g., PPVDD_AWAKE_PCPU vs PPVDD_MAME_PCPU)
- Boost rails are 5V (was 3.8V on M1/M2)
- LDOINT is 1.5V (was 1.05V)
- VDD_FIXED is 0.78V (was 0.75V)
- MagSafe uses ACE3 (U5900) instead of AAROXA9PA0830
- USB-C uses MACAW retimers (UF600/UF650) instead of separate repeater/level-shifter
- M3 Pro (A2918) does NOT use Viper/Monaco VR -- power architecture closer to Air
