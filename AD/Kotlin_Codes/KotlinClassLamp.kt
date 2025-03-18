
// Code9: Kotlin class representing a Lamp
class Lamp {
    private var isOn: Boolean = false

    fun turnOn() {
        isOn = true
    }

    fun turnOff() {
        isOn = false
    }

    fun displayLightStatus() {
        if (isOn) {
            println("Lamp is ON")
        } else {
            println("Lamp is OFF")
        }
    }
}

fun main() {
    val lamp = Lamp()
    lamp.displayLightStatus()  // Initially OFF
    lamp.turnOn()
    lamp.displayLightStatus()  // Now ON
}
