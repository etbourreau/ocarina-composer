function map(value, fromMin, fromMax, toMin, toMax, clamped) {
    let val = ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin;
    return clamped ? Math.min(Math.max(val, toMin), toMax) : val;
}