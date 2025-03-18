
// Code3: Find the smallest among three numbers using nested if
fun main() {
    val n1 = 3
    val n2 = 5
    val n3 = 2
    val min = if (n1 < n2 && n1 < n3) {
        n1
    } else if (n2 < n3) {
        n2
    } else {
        n3
    }
    println("Smallest number is $min")
}
