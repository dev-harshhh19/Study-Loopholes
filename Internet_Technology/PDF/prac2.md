## Practical 2

### Aim

Create an **Inter-LAN connection** using a router.

---

### Background Information

This practical demonstrates communication between two different LANs using a router in **Cisco Packet Tracer**.

Each LAN is connected to a separate switch. Since devices in different networks cannot communicate directly, a router is used to enable communication between them. Connectivity is verified using the `ping` command, and packet movement can be observed using **Simulation Mode**.

---

### Procedure

#### Step 1: Place the Network Devices

* Select **1 Router (1941)**
* Select **2 Switches (2960)**
* Select **6 PCs**

---

#### Step 2: Connect the Devices

* Connect **PC0, PC1, PC2** to **Switch0** using *copper straight-through cables*.
* Connect **PC3, PC4, PC5** to **Switch1** using *copper straight-through cables*.
* Connect **Switch0** to **Router Gig0/0** using a *copper straight-through cable*.
* Connect **Switch1** to **Router Gig0/1** using a *copper straight-through cable*.

---

#### Step 3: Configure IP Addresses on PCs

Assign IP addresses manually to each PC.

**LAN 1 (Connected to Switch0 – Router Gig0/0)**

* PC0 → `192.168.1.2` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.1.1`
* PC1 → `192.168.1.3` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.1.1`
* PC2 → `192.168.1.4` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.1.1`

**LAN 2 (Connected to Switch1 – Router Gig0/1)**

* PC3 → `192.168.2.2` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.2.1`
* PC4 → `192.168.2.3` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.2.1`
* PC5 → `192.168.2.4` | Subnet Mask: `255.255.255.0` | Default Gateway: `192.168.2.1`

---

#### Step 4: Configure the Router

1. Click on the router.
2. Go to the **CLI tab**.
3. Enter the following commands:

```bash
enable
configure terminal

interface gigabitEthernet 0/0
ip address 192.168.1.1 255.255.255.0
no shutdown
exit

interface gigabitEthernet 0/1
ip address 192.168.2.1 255.255.255.0
no shutdown
exit

end
write memory
```

---

#### Step 5: Verify Connectivity

1. On any PC, go to **Desktop → Command Prompt**.
2. Use the `ping` command to test communication between different LANs.

Example:

```bash
ping 192.168.2.2
```

If configuration is correct, you should receive **Reply from** messages.

---

#### Step 6: Observe in Simulation Mode (Optional)

* Switch to **Simulation Mode** in Cisco Packet Tracer.
* Send a ping from one LAN to another.
* Observe how the packet travels:

  * From PC → Switch
  * From Switch → Router
  * From Router → Other Switch
  * To Destination PC

---

