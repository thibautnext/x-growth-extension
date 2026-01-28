#!/usr/bin/env python3
"""
Generate PNG icons for X Growth Extension
Uses Python's built-in libraries to create simple PNG files
"""

import struct
import zlib

def create_png(width, height, pixels):
    """
    Create a PNG file from raw pixel data
    pixels should be a list of (r, g, b, a) tuples
    """
    def png_chunk(chunk_type, data):
        chunk_data = chunk_type + data
        crc = zlib.crc32(chunk_data) & 0xffffffff
        return struct.pack('>I', len(data)) + chunk_data + struct.pack('>I', crc)

    # PNG signature
    png_signature = b'\x89PNG\r\n\x1a\n'

    # IHDR chunk (image header)
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = png_chunk(b'IHDR', ihdr_data)

    # IDAT chunk (image data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type for this scanline
        for x in range(width):
            idx = y * width + x
            if idx < len(pixels):
                r, g, b, a = pixels[idx]
                raw_data += bytes([r, g, b, a])
            else:
                raw_data += b'\x00\x00\x00\x00'

    compressed_data = zlib.compress(raw_data, 9)
    idat_chunk = png_chunk(b'IDAT', compressed_data)

    # IEND chunk
    iend_chunk = png_chunk(b'IEND', b'')

    return png_signature + ihdr_chunk + idat_chunk + iend_chunk


def draw_icon(size):
    """
    Draw the X Growth icon (growth arrow with data points)
    """
    pixels = []
    bg_color = (21, 32, 43, 255)  # #15202B
    arrow_color = (29, 155, 240, 255)  # #1D9BF0

    # Create background
    for y in range(size):
        for x in range(size):
            pixels.append(bg_color)

    def set_pixel(x, y, color):
        """Set a pixel if within bounds"""
        if 0 <= x < size and 0 <= y < size:
            idx = y * size + x
            if idx < len(pixels):
                pixels[idx] = color

    def draw_line(x0, y0, x1, y1, thickness=1):
        """Draw a line using Bresenham's algorithm"""
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy

        while True:
            # Draw thick line
            for tx in range(-thickness, thickness + 1):
                for ty in range(-thickness, thickness + 1):
                    set_pixel(x0 + tx, y0 + ty, arrow_color)

            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy

    def draw_circle(cx, cy, radius):
        """Draw a filled circle"""
        for y in range(-radius, radius + 1):
            for x in range(-radius, radius + 1):
                if x*x + y*y <= radius*radius:
                    set_pixel(cx + x, cy + y, arrow_color)

    # Calculate coordinates based on size
    padding = int(size * 0.15)
    line_thickness = max(1, size // 24)
    point_radius = max(2, size // 20)

    # Define data points
    points = [
        (padding, size - padding),  # Bottom left
        (int(size * 0.35), int(size * 0.65)),  # Middle left
        (int(size * 0.55), int(size * 0.55)),  # Middle right
        (int(size * 0.78), int(size * 0.22))   # Top right
    ]

    # Draw lines between points
    for i in range(len(points) - 1):
        x0, y0 = points[i]
        x1, y1 = points[i + 1]
        draw_line(x0, y0, x1, y1, line_thickness)

    # Draw arrow head
    arrow_tip_x = int(size * 0.85)
    arrow_tip_y = int(size * 0.15)
    arrow_size = int(size * 0.12)

    # Arrow triangle
    arrow_points = [
        (arrow_tip_x, arrow_tip_y),
        (arrow_tip_x - arrow_size, arrow_tip_y + int(arrow_size * 0.4)),
        (arrow_tip_x - int(arrow_size * 0.4), arrow_tip_y + arrow_size)
    ]

    # Fill arrow triangle (simple scan fill)
    for y in range(arrow_tip_y, arrow_tip_y + arrow_size + 5):
        for x in range(arrow_tip_x - arrow_size - 5, arrow_tip_x + 5):
            # Simple point-in-triangle test
            if is_point_in_triangle(x, y, arrow_points):
                set_pixel(x, y, arrow_color)

    # Draw data points (circles)
    for px, py in points:
        draw_circle(px, py, point_radius)

    return pixels


def is_point_in_triangle(px, py, triangle):
    """Check if point is inside triangle"""
    def sign(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

    d1 = sign((px, py), triangle[0], triangle[1])
    d2 = sign((px, py), triangle[1], triangle[2])
    d3 = sign((px, py), triangle[2], triangle[0])

    has_neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    has_pos = (d1 > 0) or (d2 > 0) or (d3 > 0)

    return not (has_neg and has_pos)


def main():
    """Generate all icon sizes"""
    sizes = [16, 48, 128]

    for size in sizes:
        print(f"Generating {size}x{size} icon...")
        pixels = draw_icon(size)
        png_data = create_png(size, size, pixels)

        filename = f"icon{size}.png"
        with open(filename, 'wb') as f:
            f.write(png_data)

        print(f"✅ Created {filename}")

    print("\n✅ All PNG icons generated successfully!")


if __name__ == "__main__":
    main()
